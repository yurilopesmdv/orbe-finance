begin;
create table public.orbe_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  institution text not null check (institution in ('bradesco','mercado-pago','inter','nubank')),
  state text not null default 'pending' check (state in ('pending','active','paused','renewal_required','revoked','error')),
  revision bigint not null default 1 check (revision > 0),
  accounts_available boolean,
  transactions_available boolean,
  investments_available boolean,
  reserves_available boolean,
  open_finance_verified_at timestamptz,
  authorization_expires_at timestamptz,
  source_updated_at timestamptz,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(id,owner_id),
  check (state <> 'active' or open_finance_verified_at is not null)
);
create table public.orbe_accounts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null,
  owner_id uuid not null,
  kind text not null default 'unknown' check (kind in ('checking','payment','investment','unknown')),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  unique(id,connection_id,owner_id),
  foreign key(connection_id,owner_id) references public.orbe_connections(id,owner_id) on delete cascade
);
create index orbe_connections_owner_idx on public.orbe_connections(owner_id);
create index orbe_accounts_connection_owner_idx on public.orbe_accounts(connection_id,owner_id);

create table orbe_private.connection_bindings (
  connection_id uuid primary key,
  owner_id uuid not null,
  external_item_id text not null unique check (length(btrim(external_item_id)) between 1 and 200),
  foreign key(connection_id,owner_id) references public.orbe_connections(id,owner_id) on delete cascade
);
create table orbe_private.account_bindings (
  account_id uuid primary key,
  connection_id uuid not null,
  owner_id uuid not null,
  external_account_id text not null check (length(btrim(external_account_id)) between 1 and 200),
  unique(connection_id,external_account_id),
  foreign key(account_id,connection_id,owner_id) references public.orbe_accounts(id,connection_id,owner_id) on delete cascade
);

alter table public.orbe_connections enable row level security;
alter table public.orbe_accounts enable row level security;
alter table orbe_private.connection_bindings enable row level security;
alter table orbe_private.account_bindings enable row level security;
revoke all on public.orbe_connections, public.orbe_accounts from public, anon, authenticated;
revoke all on orbe_private.connection_bindings, orbe_private.account_bindings from public, anon, authenticated;
grant select on public.orbe_connections, public.orbe_accounts to authenticated;
grant select,insert,update,delete on public.orbe_connections, public.orbe_accounts to service_role;
grant usage on schema orbe_private to service_role;
grant select,insert,update,delete on orbe_private.connection_bindings, orbe_private.account_bindings to service_role;
create policy orbe_connections_owner_read on public.orbe_connections for select to authenticated
  using ((select public.orbe_is_owner()) and owner_id = (select auth.uid()));
create policy orbe_accounts_owner_read on public.orbe_accounts for select to authenticated
  using ((select public.orbe_is_owner()) and owner_id = (select auth.uid()));
comment on table public.orbe_connections is 'Access metadata only. No financial values or external provider identifiers.';
comment on table public.orbe_accounts is 'Opaque account metadata only. No account numbers, holder PII or balances.';
comment on table orbe_private.connection_bindings is 'Private provider relationship, no credentials or financial payloads.';
commit;
