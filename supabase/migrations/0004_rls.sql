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
