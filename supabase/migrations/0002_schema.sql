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
