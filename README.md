# Tabacaria Mata-Jega

Sistema de ponto de venda para loja de vapes: vendas, estoque, fiado, clientes e relatórios.

**Stack:** React + TypeScript (Vite) · Tailwind CSS · Supabase (Postgres + Auth) · Lucide Icons.

## 1. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode as migrations de `supabase/migrations/` em ordem (0001 → 0005). Se preferir a CLI: `supabase db push`.
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

## 2. Configurar o projeto localmente

```bash
cp .env.example .env
npm install
```

Preencha `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. **Nunca** use a `service_role key` no frontend.

```bash
npm run dev
```

## 3. Criar o primeiro usuário (dono da loja)

1. No Supabase, vá em **Authentication → Add user** e crie o usuário do dono.
2. No **SQL Editor**, vincule-o à loja semeada:

```sql
insert into profiles (id, store_id, full_name, role)
values ('<uuid-do-usuario>', (select id from stores limit 1), 'Nome do Dono', 'owner');
```

## 4. Deploy na Vercel

1. Suba o repositório para o GitHub e importe na Vercel (preset **Vite**, build `npm run build`, output `dist`).
2. Adicione as mesmas variáveis `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` em **Project Settings → Environment Variables**.
3. Em **Authentication → URL Configuration** no Supabase, adicione o domínio da Vercel às Redirect URLs.
4. Deploy.

## 5. Teste de ponta a ponta

Login → venda à vista → venda fiada → conferir dashboard → receber pagamento de fiado.

## Estrutura

```
src/
  components/   ui/ (base), layout/, e componentes por domínio (pdv, products, cash, fiado...)
  contexts/     Auth, Toast, CashRegister
  hooks/        um hook por domínio, chamando apenas services/
  services/     única camada que fala com o Supabase (tabelas e RPCs)
  pages/        uma página por rota
  routes/       router e proteção de rotas
  types/        tipos do banco (database.types.ts) e tipos de domínio
supabase/migrations/  schema, funções RPC transacionais, RLS e seed
```

Operações críticas (venda, pagamento de fiado) passam por funções RPC no Postgres (`supabase/migrations/0003_functions.sql`), não por lógica no frontend — isso garante consistência de estoque mesmo com múltiplos operadores simultâneos.
