begin;
do $$
begin
  if exists(select 1 from public.orbe_connections) then
    raise exception 'consent_split_requires_review_for_existing_connections';
  end if;
end $$;
alter table public.orbe_connections rename column authorization_expires_at to proxy_consent_expires_at;
alter table public.orbe_connections add column bank_consent_expires_at timestamptz;
comment on column public.orbe_connections.proxy_consent_expires_at is 'Observed proxy authorization expiry. Unknown denies collection reads; never infer by adding a year.';
comment on column public.orbe_connections.bank_consent_expires_at is 'Original bank authorization expiry when proven; unknown remains null.';

create or replace function orbe_private.fence_connection_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.revision is null or new.revision < old.revision then
    raise exception using errcode='23514', message='connection_revision_must_not_decrease';
  end if;
  if row(new.owner_id,new.institution,new.state,new.open_finance_verified_at,new.proxy_consent_expires_at,new.bank_consent_expires_at,new.accounts_available,new.transactions_available,new.investments_available,new.reserves_available)
     is distinct from row(old.owner_id,old.institution,old.state,old.open_finance_verified_at,old.proxy_consent_expires_at,old.bank_consent_expires_at,old.accounts_available,old.transactions_available,old.investments_available,old.reserves_available) then
    new.revision := greatest(new.revision,old.revision + 1);
  end if;
  return new;
end $$;
create or replace function orbe_private.connection_read_eligible(p_connection public.orbe_connections,p_owner_id uuid,p_revision bigint)
returns boolean language sql security definer set search_path = '' as $$
  select coalesce(
    (p_connection).owner_id=p_owner_id and (p_connection).revision=p_revision
    and (p_connection).state='active' and (p_connection).open_finance_verified_at is not null
    and (p_connection).proxy_consent_expires_at is not null and (p_connection).proxy_consent_expires_at > clock_timestamp()
    and ((p_connection).bank_consent_expires_at is null or (p_connection).bank_consent_expires_at > clock_timestamp())
    and exists(select 1 from orbe_private.app_owner where user_id=p_owner_id), false);
$$;
-- Keep both helper functions inaccessible directly, including for service_role.
revoke all on function orbe_private.fence_connection_revision() from public, anon, authenticated, service_role;
revoke all on function orbe_private.connection_read_eligible(public.orbe_connections,uuid,bigint) from public, anon, authenticated, service_role;
commit;
