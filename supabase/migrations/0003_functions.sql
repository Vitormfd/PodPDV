-- =========================================================================
-- RPC functions: mutating operations that must be atomic and are executed
-- server-side only. security definer + explicit auth.uid()/store_id checks
-- inside the body (never trust security definer alone).
-- =========================================================================

-- ---------------------------------------------------------------------
-- create_sale
-- items shape: [{ "product_id": uuid, "quantity": int, "unit_price": numeric, "discount": numeric }]
-- ---------------------------------------------------------------------
create or replace function public.create_sale(
  p_cash_register_id uuid,
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

  perform 1 from public.cash_registers
    where id = p_cash_register_id and store_id = v_store_id and status = 'open'
    for update;
  if not found then
    raise exception 'Caixa informado nao esta aberto para esta loja';
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
    store_id, cash_register_id, customer_id, sold_by, subtotal, discount, total,
    payment_method, cash_received, change_given, idempotency_key
  ) values (
    v_store_id, p_cash_register_id, p_customer_id, v_profile_id, v_subtotal,
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
  else
    insert into public.cash_movements (
      store_id, cash_register_id, movement_type, payment_method, direction, amount, reference_sale_id, created_by
    ) values (
      v_store_id, p_cash_register_id, 'sale', p_payment_method, 'in', v_total, v_sale.id, v_profile_id
    );
  end if;

  return v_sale;
end;
$$;

-- ---------------------------------------------------------------------
-- register_inventory_movement (manual entradas/saidas)
-- ---------------------------------------------------------------------
create or replace function public.register_inventory_movement(
  p_product_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_unit_cost numeric,
  p_reason text
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_role text;
  v_profile_id uuid := auth.uid();
  v_direction text;
  v_product public.products;
  v_movement public.inventory_movements;
begin
  select store_id, role into v_store_id, v_role from public.profiles where id = v_profile_id and active;
  if v_store_id is null then
    raise exception 'Usuario sem loja associada ou inativo';
  end if;

  if p_movement_type not in ('compra', 'ajuste_entrada', 'devolucao', 'perda', 'dano', 'ajuste_saida') then
    raise exception 'Tipo de movimentacao invalido para lancamento manual';
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantidade deve ser maior que zero';
  end if;

  v_direction := case
    when p_movement_type in ('compra', 'ajuste_entrada', 'devolucao') then 'in'
    else 'out'
  end;

  select * into v_product from public.products where id = p_product_id and store_id = v_store_id for update;
  if not found then
    raise exception 'Produto nao encontrado';
  end if;

  if v_direction = 'out' and v_product.stock_quantity < p_quantity then
    raise exception 'Estoque insuficiente para registrar esta saida';
  end if;

  if v_direction = 'in' then
    update public.products set stock_quantity = stock_quantity + p_quantity where id = v_product.id;
  else
    update public.products set stock_quantity = stock_quantity - p_quantity where id = v_product.id;
  end if;

  insert into public.inventory_movements (
    store_id, product_id, movement_type, direction, quantity, unit_cost, reason, created_by
  ) values (
    v_store_id, p_product_id, p_movement_type, v_direction, p_quantity, p_unit_cost, p_reason, v_profile_id
  ) returning * into v_movement;

  return v_movement;
end;
$$;

-- ---------------------------------------------------------------------
-- register_receivable_payment
-- ---------------------------------------------------------------------
create or replace function public.register_receivable_payment(
  p_receivable_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_cash_register_id uuid,
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
    receivable_id, amount, payment_method, received_by, cash_register_id, notes
  ) values (
    p_receivable_id, p_amount, p_payment_method, v_profile_id, p_cash_register_id, p_notes
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

  if p_cash_register_id is not null then
    perform 1 from public.cash_registers
      where id = p_cash_register_id and store_id = v_store_id and status = 'open';
    if found then
      insert into public.cash_movements (
        store_id, cash_register_id, movement_type, payment_method, direction, amount,
        reference_receivable_payment_id, created_by
      ) values (
        v_store_id, p_cash_register_id, 'receivable_payment', p_payment_method, 'in', p_amount,
        v_payment.id, v_profile_id
      );
    end if;
  end if;

  return v_payment;
end;
$$;

-- ---------------------------------------------------------------------
-- open_cash_register
-- ---------------------------------------------------------------------
create or replace function public.open_cash_register(
  p_opening_balance numeric
)
returns public.cash_registers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_profile_id uuid := auth.uid();
  v_register public.cash_registers;
begin
  select store_id into v_store_id from public.profiles where id = v_profile_id and active;
  if v_store_id is null then
    raise exception 'Usuario sem loja associada ou inativo';
  end if;

  if p_opening_balance < 0 then
    raise exception 'Saldo inicial nao pode ser negativo';
  end if;

  perform 1 from public.cash_registers where store_id = v_store_id and status = 'open';
  if found then
    raise exception 'Ja existe um caixa aberto para esta loja';
  end if;

  insert into public.cash_registers (store_id, opened_by, opening_balance)
    values (v_store_id, v_profile_id, p_opening_balance)
    returning * into v_register;

  return v_register;
end;
$$;

-- ---------------------------------------------------------------------
-- close_cash_register
-- ---------------------------------------------------------------------
create or replace function public.close_cash_register(
  p_cash_register_id uuid,
  p_counted_cash numeric,
  p_notes text
)
returns public.cash_registers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_profile_id uuid := auth.uid();
  v_register public.cash_registers;
  v_cash_in numeric(12,2);
  v_cash_out numeric(12,2);
  v_expected numeric(12,2);
begin
  select store_id into v_store_id from public.profiles where id = v_profile_id and active;
  if v_store_id is null then
    raise exception 'Usuario sem loja associada ou inativo';
  end if;

  select * into v_register from public.cash_registers
    where id = p_cash_register_id and store_id = v_store_id and status = 'open'
    for update;
  if not found then
    raise exception 'Caixa nao encontrado ou ja fechado';
  end if;

  select coalesce(sum(amount), 0) into v_cash_in
    from public.cash_movements
    where cash_register_id = p_cash_register_id and payment_method = 'dinheiro' and direction = 'in';

  select coalesce(sum(amount), 0) into v_cash_out
    from public.cash_movements
    where cash_register_id = p_cash_register_id and payment_method = 'dinheiro' and direction = 'out';

  v_expected := v_register.opening_balance + v_cash_in - v_cash_out;

  update public.cash_registers
    set status = 'closed',
        closed_at = now(),
        closed_by = v_profile_id,
        expected_cash = v_expected,
        counted_cash = p_counted_cash,
        difference = p_counted_cash - v_expected,
        notes = p_notes
    where id = p_cash_register_id
    returning * into v_register;

  return v_register;
end;
$$;

-- ---------------------------------------------------------------------
-- add_manual_cash_movement
-- ---------------------------------------------------------------------
create or replace function public.add_manual_cash_movement(
  p_cash_register_id uuid,
  p_direction text,
  p_amount numeric,
  p_description text
)
returns public.cash_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_profile_id uuid := auth.uid();
  v_movement public.cash_movements;
begin
  select store_id into v_store_id from public.profiles where id = v_profile_id and active;
  if v_store_id is null then
    raise exception 'Usuario sem loja associada ou inativo';
  end if;

  if p_direction not in ('in', 'out') then
    raise exception 'Direcao invalida';
  end if;

  if p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero';
  end if;

  perform 1 from public.cash_registers
    where id = p_cash_register_id and store_id = v_store_id and status = 'open';
  if not found then
    raise exception 'Caixa nao encontrado ou ja fechado';
  end if;

  insert into public.cash_movements (
    store_id, cash_register_id, movement_type, payment_method, direction, amount, description, created_by
  ) values (
    v_store_id, p_cash_register_id, case when p_direction = 'in' then 'manual_in' else 'manual_out' end,
    'dinheiro', p_direction, p_amount, p_description, v_profile_id
  ) returning * into v_movement;

  return v_movement;
end;
$$;

-- ---------------------------------------------------------------------
-- Read helpers (security invoker; RLS on base tables already scopes by store)
-- ---------------------------------------------------------------------
create or replace function public.get_dashboard_summary(
  p_date_from timestamptz,
  p_date_to timestamptz
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'revenue', coalesce((
      select sum(total) from public.sales
      where store_id = public.current_store_id() and status = 'completed'
        and created_at between p_date_from and p_date_to
    ), 0),
    'profit', coalesce((
      select sum(si.line_total - (si.unit_cost * si.quantity))
      from public.sale_items si
      join public.sales s on s.id = si.sale_id
      where s.store_id = public.current_store_id() and s.status = 'completed'
        and s.created_at between p_date_from and p_date_to
    ), 0),
    'sales_count', coalesce((
      select count(*) from public.sales
      where store_id = public.current_store_id() and status = 'completed'
        and created_at between p_date_from and p_date_to
    ), 0),
    'discounts_given', coalesce((
      select sum(discount) from public.sales
      where store_id = public.current_store_id() and status = 'completed'
        and created_at between p_date_from and p_date_to
    ), 0),
    'open_receivables_total', coalesce((
      select sum(remaining_amount) from public.receivables
      where store_id = public.current_store_id() and status <> 'paid'
    ), 0),
    'debtor_count', coalesce((
      select count(distinct customer_id) from public.receivables
      where store_id = public.current_store_id() and status <> 'paid'
    ), 0),
    'low_stock_count', coalesce((
      select count(*) from public.products
      where store_id = public.current_store_id() and is_active and stock_quantity <= min_stock
    ), 0),
    'by_payment_method', coalesce((
      select jsonb_object_agg(payment_method, total) from (
        select payment_method, sum(total) as total from public.sales
        where store_id = public.current_store_id() and status = 'completed'
          and created_at between p_date_from and p_date_to
        group by payment_method
      ) t
    ), '{}'::jsonb)
  );
$$;

create or replace function public.get_best_sellers(
  p_date_from timestamptz,
  p_date_to timestamptz,
  p_limit int default 10
)
returns table (
  product_id uuid,
  product_name text,
  quantity_sold bigint,
  revenue numeric
)
language sql
stable
as $$
  select si.product_id, p.name, sum(si.quantity), sum(si.line_total)
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  join public.products p on p.id = si.product_id
  where s.store_id = public.current_store_id() and s.status = 'completed'
    and s.created_at between p_date_from and p_date_to
  group by si.product_id, p.name
  order by sum(si.quantity) desc
  limit p_limit;
$$;

create or replace function public.get_low_stock_products()
returns table (
  id uuid,
  name text,
  stock_quantity integer,
  min_stock integer
)
language sql
stable
as $$
  select id, name, stock_quantity, min_stock
  from public.products
  where store_id = public.current_store_id() and is_active and stock_quantity <= min_stock
  order by (min_stock - stock_quantity) desc;
$$;

create or replace function public.get_profit_report(
  p_date_from timestamptz,
  p_date_to timestamptz
)
returns table (
  product_id uuid,
  product_name text,
  quantity_sold bigint,
  revenue numeric,
  cost numeric,
  profit numeric
)
language sql
stable
as $$
  select
    si.product_id,
    p.name,
    sum(si.quantity),
    sum(si.line_total),
    sum(si.unit_cost * si.quantity),
    sum(si.line_total - (si.unit_cost * si.quantity))
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  join public.products p on p.id = si.product_id
  where s.store_id = public.current_store_id() and s.status = 'completed'
    and s.created_at between p_date_from and p_date_to
  group by si.product_id, p.name
  order by sum(si.line_total - (si.unit_cost * si.quantity)) desc;
$$;

create or replace function public.get_cash_register_totals(p_cash_register_id uuid)
returns table (
  payment_method text,
  direction text,
  total numeric
)
language sql
stable
as $$
  select payment_method, direction, sum(amount)
  from public.cash_movements
  where cash_register_id = p_cash_register_id and store_id = public.current_store_id()
  group by payment_method, direction;
$$;
