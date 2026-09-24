-- =========================================================================
-- Remove the mandatory cash-register (open/close) requirement.
-- This store isn't a daily-operating shop with shift handoffs — it's a
-- single seller making occasional sales, so the caixa open/close ceremony
-- does not fit and previously blocked every sale until one was opened.
-- Sales and receivable payments no longer depend on an open register.
-- The cash_registers/cash_movements tables and their RPCs are left in place
-- (unused, harmless) rather than dropped, since they already hold data.
-- =========================================================================

alter table public.sales alter column cash_register_id drop not null;

drop function if exists public.create_sale(uuid, uuid, jsonb, numeric, text, numeric, uuid);

create or replace function public.create_sale(
  p_customer_id uuid,
  p_items jsonb,
  p_discount numeric,
  p_payment_method text,
  p_cash_received numeric,
  p_idempotency_key uuid
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_profile_id uuid := auth.uid();
  v_existing_sale public.sales;
  v_item jsonb;
  v_product public.products;
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2);
  v_change numeric(12,2) := 0;
  v_sale public.sales;
  v_line_total numeric(12,2);
begin
  select store_id into v_store_id from public.profiles where id = v_profile_id and active;
  if v_store_id is null then
    raise exception 'Usuario sem loja associada ou inativo';
  end if;

  -- Idempotency: if this key was already processed, return the existing sale.
  select * into v_existing_sale
    from public.sales
    where store_id = v_store_id and idempotency_key = p_idempotency_key;
  if found then
    return v_existing_sale;
  end if;

  if p_payment_method not in ('dinheiro', 'pix', 'debito', 'credito', 'fiado') then
    raise exception 'Forma de pagamento invalida';
  end if;

  if p_payment_method = 'fiado' and p_customer_id is null then
    raise exception 'Venda fiada exige um cliente selecionado';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'A venda precisa ter ao menos um item';
  end if;

  -- Compute totals while validating and locking each product row.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if (v_item->>'quantity')::int <= 0 then
      raise exception 'Quantidade invalida para o produto %', v_item->>'product_id';
    end if;

    select * into v_product
      from public.products
      where id = (v_item->>'product_id')::uuid and store_id = v_store_id
      for update;

    if not found or not v_product.is_active then
      raise exception 'Produto nao encontrado ou inativo: %', v_item->>'product_id';
    end if;

    if v_product.stock_quantity < (v_item->>'quantity')::int then
      raise exception 'Estoque insuficiente para o produto %', v_product.name;
    end if;

    v_line_total := ((v_item->>'unit_price')::numeric * (v_item->>'quantity')::int)
      - coalesce((v_item->>'discount')::numeric, 0);
    if v_line_total < 0 then
      raise exception 'Desconto maior que o valor do item: %', v_product.name;
    end if;

    v_subtotal := v_subtotal + v_line_total;
  end loop;

  v_total := v_subtotal - coalesce(p_discount, 0);
  if v_total < 0 then
    raise exception 'Desconto total maior que o subtotal da venda';
  end if;

  if p_payment_method <> 'fiado' then
    if p_cash_received is not null and p_cash_received >= v_total then
      v_change := p_cash_received - v_total;
    else
      v_change := 0;
    end if;
  end if;

  insert into public.sales (
    store_id, customer_id, sold_by, subtotal, discount, total,
    payment_method, cash_received, change_given, idempotency_key
  ) values (
    v_store_id, p_customer_id, v_profile_id, v_subtotal,
    coalesce(p_discount, 0), v_total, p_payment_method, p_cash_received, v_change, p_idempotency_key
  ) returning * into v_sale;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;

    v_line_total := ((v_item->>'unit_price')::numeric * (v_item->>'quantity')::int)
      - coalesce((v_item->>'discount')::numeric, 0);

    insert into public.sale_items (
      sale_id, product_id, quantity, unit_price, unit_cost, discount, line_total
    ) values (
      v_sale.id, v_product.id, (v_item->>'quantity')::int, (v_item->>'unit_price')::numeric,
      v_product.cost_price, coalesce((v_item->>'discount')::numeric, 0), v_line_total
    );

    update public.products
      set stock_quantity = stock_quantity - (v_item->>'quantity')::int
      where id = v_product.id;

    insert into public.inventory_movements (
      store_id, product_id, movement_type, direction, quantity, unit_cost, reference_sale_id, created_by
    ) values (
      v_store_id, v_product.id, 'venda', 'out', (v_item->>'quantity')::int, v_product.cost_price, v_sale.id, v_profile_id
    );
  end loop;

  if p_payment_method = 'fiado' then
    insert into public.receivables (store_id, customer_id, sale_id, original_amount)
      values (v_store_id, p_customer_id, v_sale.id, v_total);
  end if;

  return v_sale;
end;
$$;

drop function if exists public.register_receivable_payment(uuid, numeric, text, uuid, text, boolean);

create or replace function public.register_receivable_payment(
  p_receivable_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_notes text,
  p_allow_overpayment boolean default false
)
returns public.receivable_payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_role text;
  v_profile_id uuid := auth.uid();
  v_receivable public.receivables;
  v_payment public.receivable_payments;
  v_new_paid numeric(12,2);
  v_new_status text;
begin
  select store_id, role into v_store_id, v_role from public.profiles where id = v_profile_id and active;
  if v_store_id is null then
    raise exception 'Usuario sem loja associada ou inativo';
  end if;

  if p_amount <= 0 then
    raise exception 'Valor do pagamento deve ser maior que zero';
  end if;

  if p_payment_method not in ('dinheiro', 'pix', 'debito', 'credito') then
    raise exception 'Forma de pagamento invalida';
  end if;

  select * into v_receivable from public.receivables
    where id = p_receivable_id and store_id = v_store_id for update;
  if not found then
    raise exception 'Conta a receber nao encontrada';
  end if;

  if p_amount > v_receivable.remaining_amount then
    if not (p_allow_overpayment and v_role in ('owner', 'manager')) then
      raise exception 'Pagamento maior que o saldo pendente (%)', v_receivable.remaining_amount;
    end if;
  end if;

  insert into public.receivable_payments (
    receivable_id, amount, payment_method, received_by, notes
  ) values (
    p_receivable_id, p_amount, p_payment_method, v_profile_id, p_notes
  ) returning * into v_payment;

  v_new_paid := v_receivable.paid_amount + p_amount;
  v_new_status := case
    when v_new_paid >= v_receivable.original_amount then 'paid'
    when v_new_paid > 0 then 'partially_paid'
    else 'open'
  end;

  update public.receivables
    set paid_amount = v_new_paid, status = v_new_status
    where id = p_receivable_id;

  return v_payment;
end;
$$;
