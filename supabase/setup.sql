-- Extensions needed by the schema
create extension if not exists pg_trgm with schema public;
-- =========================================================================
-- Schema: PDV para loja de vapes
-- Todas as tabelas de negocio carregam store_id para permitir expansao
-- futura para multiplas lojas sem redesenho do schema.
-- =========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- stores
-- ---------------------------------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_stores_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id),
  full_name text not null,
  role text not null default 'cashier' check (role in ('owner', 'manager', 'cashier')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_store on public.profiles(store_id, active);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Helper used throughout RLS policies and RPCs.
create or replace function public.current_store_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select store_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, name)
);

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  category_id uuid references public.categories(id),
  name text not null,
  barcode text,
  brand text,
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  sale_price numeric(12, 2) not null default 0 check (sale_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_store_active on public.products(store_id, is_active);
create index idx_products_store_category on public.products(store_id, category_id);
create index idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
create unique index idx_products_store_barcode on public.products(store_id, barcode) where barcode is not null;

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Products are never hard-deleted once referenced by a sale: deactivate instead.
-- No delete RLS policy is granted (see 0004_rls.sql); this trigger is defense
-- in depth against direct table access (e.g. future service-role scripts).
create or replace function public.prevent_product_delete_if_sold()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.sale_items where product_id = old.id) then
    raise exception 'Produto com vendas registradas nao pode ser excluido, apenas desativado';
  end if;
  return old;
end;
$$;

-- ---------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  name text not null,
  phone text,
  cpf text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customers_store_name on public.customers(store_id, name);
create index idx_customers_store_phone on public.customers(store_id, phone);

create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- cash_registers
-- ---------------------------------------------------------------------
create table public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  opened_by uuid not null references public.profiles(id),
  closed_by uuid references public.profiles(id),
  opening_balance numeric(12, 2) not null default 0 check (opening_balance >= 0),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed')),
  expected_cash numeric(12, 2),
  counted_cash numeric(12, 2),
  difference numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one open register per store at a time.
create unique index idx_one_open_register_per_store
  on public.cash_registers(store_id)
  where status = 'open';

create index idx_cash_registers_store_status on public.cash_registers(store_id, status);

create trigger trg_cash_registers_updated_at
  before update on public.cash_registers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- sales
-- ---------------------------------------------------------------------
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  cash_register_id uuid not null references public.cash_registers(id),
  customer_id uuid references public.customers(id),
  sold_by uuid not null references public.profiles(id),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  total numeric(12, 2) not null check (total >= 0),
  payment_method text not null check (payment_method in ('dinheiro', 'pix', 'debito', 'credito', 'fiado')),
  cash_received numeric(12, 2),
  change_given numeric(12, 2),
  status text not null default 'completed' check (status in ('completed', 'cancelled')),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_fiado_requires_customer check (payment_method <> 'fiado' or customer_id is not null),
  constraint sales_idempotency_unique unique (store_id, idempotency_key)
);

create index idx_sales_store_created on public.sales(store_id, created_at desc);
create index idx_sales_customer on public.sales(customer_id);
create index idx_sales_cash_register on public.sales(cash_register_id);

create trigger trg_sales_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- sale_items
-- ---------------------------------------------------------------------
create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  unit_cost numeric(12, 2) not null check (unit_cost >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index idx_sale_items_sale on public.sale_items(sale_id);
create index idx_sale_items_product on public.sale_items(product_id);

-- Now that sale_items exists, attach the delete-guard trigger on products.
create trigger trg_products_prevent_delete
  before delete on public.products
  for each row execute function public.prevent_product_delete_if_sold();

-- ---------------------------------------------------------------------
-- inventory_movements
-- ---------------------------------------------------------------------
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  product_id uuid not null references public.products(id),
  movement_type text not null check (
    movement_type in ('compra', 'ajuste_entrada', 'devolucao', 'venda', 'perda', 'dano', 'ajuste_saida')
  ),
  direction text not null check (direction in ('in', 'out')),
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12, 2),
  reason text,
  reference_sale_id uuid references public.sales(id),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_inventory_movements_product on public.inventory_movements(store_id, product_id, created_at desc);
create index idx_inventory_movements_sale on public.inventory_movements(reference_sale_id);

-- ---------------------------------------------------------------------
-- receivables (fiado)
-- ---------------------------------------------------------------------
create table public.receivables (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  customer_id uuid not null references public.customers(id),
  sale_id uuid not null references public.sales(id),
  original_amount numeric(12, 2) not null check (original_amount > 0),
  paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0),
  remaining_amount numeric(12, 2) generated always as (original_amount - paid_amount) stored,
  status text not null default 'open' check (status in ('open', 'partially_paid', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint receivables_sale_unique unique (sale_id),
  constraint receivables_remaining_nonnegative check (original_amount - paid_amount >= 0)
);

create index idx_receivables_store_customer_status on public.receivables(store_id, customer_id, status);

create trigger trg_receivables_updated_at
  before update on public.receivables
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- receivable_payments (append-only)
-- ---------------------------------------------------------------------
create table public.receivable_payments (
  id uuid primary key default gen_random_uuid(),
  receivable_id uuid not null references public.receivables(id),
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('dinheiro', 'pix', 'debito', 'credito')),
  received_by uuid not null references public.profiles(id),
  cash_register_id uuid references public.cash_registers(id),
  notes text,
  created_at timestamptz not null default now()
);

create index idx_receivable_payments_receivable on public.receivable_payments(receivable_id);

-- ---------------------------------------------------------------------
-- cash_movements (single source of truth for cash flow)
-- ---------------------------------------------------------------------
create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  cash_register_id uuid not null references public.cash_registers(id),
  movement_type text not null check (movement_type in ('sale', 'receivable_payment', 'manual_in', 'manual_out')),
  payment_method text check (payment_method in ('dinheiro', 'pix', 'debito', 'credito')),
  direction text not null check (direction in ('in', 'out')),
  amount numeric(12, 2) not null check (amount > 0),
  reference_sale_id uuid references public.sales(id),
  reference_receivable_payment_id uuid references public.receivable_payments(id),
  description text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_cash_movements_register on public.cash_movements(store_id, cash_register_id, created_at);
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
-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.cash_registers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.receivables enable row level security;
alter table public.receivable_payments enable row level security;
alter table public.cash_movements enable row level security;

-- ---------------------------------------------------------------------
-- stores: read-only for members of the store; no client-side writes
-- ---------------------------------------------------------------------
create policy stores_select on public.stores
  for select using (id = public.current_store_id());

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select using (store_id = public.current_store_id());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_update_by_owner on public.profiles
  for update using (
    store_id = public.current_store_id() and public.current_role() = 'owner'
  )
  with check (
    store_id = public.current_store_id() and public.current_role() = 'owner'
  );

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create policy categories_select on public.categories
  for select using (store_id = public.current_store_id());
create policy categories_insert on public.categories
  for insert with check (store_id = public.current_store_id());
create policy categories_update on public.categories
  for update using (store_id = public.current_store_id());
create policy categories_delete on public.categories
  for delete using (store_id = public.current_store_id());

-- ---------------------------------------------------------------------
-- products (no delete policy: deactivate instead)
-- ---------------------------------------------------------------------
create policy products_select on public.products
  for select using (store_id = public.current_store_id());
create policy products_insert on public.products
  for insert with check (store_id = public.current_store_id());
create policy products_update on public.products
  for update using (store_id = public.current_store_id());

-- ---------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------
create policy customers_select on public.customers
  for select using (store_id = public.current_store_id());
create policy customers_insert on public.customers
  for insert with check (store_id = public.current_store_id());
create policy customers_update on public.customers
  for update using (store_id = public.current_store_id());

-- ---------------------------------------------------------------------
-- cash_registers (writes go through RPCs, but selects are direct)
-- ---------------------------------------------------------------------
create policy cash_registers_select on public.cash_registers
  for select using (store_id = public.current_store_id());

-- ---------------------------------------------------------------------
-- sales / sale_items (writes go through create_sale RPC only)
-- ---------------------------------------------------------------------
create policy sales_select on public.sales
  for select using (store_id = public.current_store_id());

create policy sale_items_select on public.sale_items
  for select using (
    exists (
      select 1 from public.sales s
      where s.id = sale_items.sale_id and s.store_id = public.current_store_id()
    )
  );

-- ---------------------------------------------------------------------
-- inventory_movements (writes go through RPCs; select is direct)
-- ---------------------------------------------------------------------
create policy inventory_movements_select on public.inventory_movements
  for select using (store_id = public.current_store_id());

-- ---------------------------------------------------------------------
-- receivables / receivable_payments
-- ---------------------------------------------------------------------
create policy receivables_select on public.receivables
  for select using (store_id = public.current_store_id());

create policy receivable_payments_select on public.receivable_payments
  for select using (
    exists (
      select 1 from public.receivables r
      where r.id = receivable_payments.receivable_id and r.store_id = public.current_store_id()
    )
  );

-- ---------------------------------------------------------------------
-- cash_movements
-- ---------------------------------------------------------------------
create policy cash_movements_select on public.cash_movements
  for select using (store_id = public.current_store_id());
-- =========================================================================
-- Seed: uma unica loja para a v1. Apos criar o primeiro usuario em
-- Authentication > Add user, vincule-o a este registro em profiles:
--
--   insert into public.profiles (id, store_id, full_name, role)
--   values ('<uuid-do-usuario>', (select id from public.stores limit 1), 'Nome do Dono', 'owner');
-- =========================================================================

insert into public.stores (name) values ('Tabacaria Mata-Jega');

insert into public.categories (store_id, name)
select id, unnest(array['E-liquids', 'Pods', 'Dispositivos', 'Acessórios', 'Resistências'])
from public.stores;
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
