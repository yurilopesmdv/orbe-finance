begin;
create table orbe_private.app_owner (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table orbe_private.app_owner enable row level security;
revoke all on table orbe_private.app_owner from public, anon, authenticated;

create function public.orbe_is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from orbe_private.app_owner where user_id = (select auth.uid())
  );
$$;
revoke all on function public.orbe_is_owner() from public, anon;
grant execute on function public.orbe_is_owner() to authenticated;
comment on function public.orbe_is_owner() is 'Boolean authorization for the current verified identity only; never returns owner identifiers.';
commit;
