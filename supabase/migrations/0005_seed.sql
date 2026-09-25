-- =========================================================================
-- Seed: uma unica loja para a v1. Apos criar o primeiro usuario em
-- Authentication > Add user, vincule-o a este registro em profiles:
--
--   insert into public.profiles (id, store_id, full_name, role)
--   values ('<uuid-do-usuario>', (select id from public.stores limit 1), 'Nome do Dono', 'owner');
-- =========================================================================

insert into public.stores (name) values ('Tabacaria Mata Jega');

insert into public.categories (store_id, name)
select id, unnest(array['E-liquids', 'Pods', 'Dispositivos', 'Acessórios', 'Resistências'])
from public.stores;
