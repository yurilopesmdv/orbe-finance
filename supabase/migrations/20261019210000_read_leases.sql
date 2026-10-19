begin;

create table orbe_private.connection_reads (
  connection_id uuid primary key,
  owner_id uuid not null,
  connection_revision bigint not null check(connection_revision > 0),
  lease_id uuid not null,
  started_at timestamptz not null,
  lease_expires_at timestamptz not null,
  next_read_at timestamptz not null,
  completed_at timestamptz,
  outcome text check(outcome in ('success','failed','cancelled')),
  foreign key(connection_id,owner_id) references public.orbe_connections(id,owner_id) on delete cascade,
  check(next_read_at >= lease_expires_at),
  check((completed_at is null) = (outcome is null))
);
alter table orbe_private.connection_reads enable row level security;
revoke all on orbe_private.connection_reads from public, anon, authenticated, service_role;
comment on table orbe_private.connection_reads is 'One bounded read lease/cooldown per connection. No financial values, cursors, provider responses or credentials.';

create function orbe_private.fence_connection_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.revision is null or new.revision < old.revision then
    raise exception using errcode='23514', message='connection_revision_must_not_decrease';
  end if;
  if row(new.owner_id,new.institution,new.state,new.open_finance_verified_at,new.authorization_expires_at,new.accounts_available,new.transactions_available,new.investments_available,new.reserves_available)
     is distinct from row(old.owner_id,old.institution,old.state,old.open_finance_verified_at,old.authorization_expires_at,old.accounts_available,old.transactions_available,old.investments_available,old.reserves_available) then
    new.revision := greatest(new.revision,old.revision + 1);
  end if;
  return new;
end $$;
revoke all on function orbe_private.fence_connection_revision() from public, anon, authenticated, service_role;
create trigger orbe_connections_revision before update on public.orbe_connections
  for each row execute function orbe_private.fence_connection_revision();

create function orbe_private.connection_read_eligible(p_connection public.orbe_connections,p_owner_id uuid,p_revision bigint)
returns boolean language sql security definer set search_path = '' as $$
  select coalesce(
    (p_connection).owner_id=p_owner_id and (p_connection).revision=p_revision
    and (p_connection).state='active' and (p_connection).open_finance_verified_at is not null
    and ((p_connection).authorization_expires_at is null or (p_connection).authorization_expires_at > clock_timestamp())
    and exists(select 1 from orbe_private.app_owner where user_id=p_owner_id), false);
$$;
revoke all on function orbe_private.connection_read_eligible(public.orbe_connections,uuid,bigint) from public, anon, authenticated, service_role;

create function public.orbe_begin_connection_read(p_connection_id uuid,p_owner_id uuid,p_expected_revision bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  connection public.orbe_connections;
  prior orbe_private.connection_reads;
  instant timestamptz;
  identifier uuid;
begin
  select * into connection from public.orbe_connections where id=p_connection_id for update;
  if not found or not orbe_private.connection_read_eligible(connection,p_owner_id,p_expected_revision)
     or not (coalesce(connection.accounts_available,false) or coalesce(connection.transactions_available,false) or coalesce(connection.investments_available,false) or coalesce(connection.reserves_available,false)) then
    return jsonb_build_object('status','unavailable');
  end if;
  instant := clock_timestamp();
  select * into prior from orbe_private.connection_reads where connection_id=p_connection_id for update;
  if found then
    if prior.connection_revision=connection.revision and prior.completed_at is null and prior.lease_expires_at > instant then
      return jsonb_build_object('status','busy');
    end if;
    if prior.next_read_at > instant then
      return jsonb_build_object('status','cooldown','next_read_at',prior.next_read_at);
    end if;
  end if;
  identifier := gen_random_uuid();
  insert into orbe_private.connection_reads(connection_id,owner_id,connection_revision,lease_id,started_at,lease_expires_at,next_read_at)
    values(p_connection_id,p_owner_id,connection.revision,identifier,instant,instant+interval '120 seconds',instant+interval '900 seconds')
    on conflict(connection_id) do update set owner_id=excluded.owner_id,connection_revision=excluded.connection_revision,
      lease_id=excluded.lease_id,started_at=excluded.started_at,lease_expires_at=excluded.lease_expires_at,next_read_at=excluded.next_read_at,completed_at=null,outcome=null;
  return jsonb_build_object('status','acquired','lease_id',identifier,'revision',connection.revision,'lease_expires_at',instant+interval '120 seconds','next_read_at',instant+interval '900 seconds');
end $$;

create function public.orbe_check_connection_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_product text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare connection public.orbe_connections;
begin
  select * into connection from public.orbe_connections where id=p_connection_id for update;
  if not found or not orbe_private.connection_read_eligible(connection,p_owner_id,p_revision) then return false; end if;
  if not coalesce(case p_product when 'accounts' then connection.accounts_available when 'transactions' then connection.transactions_available
    when 'investments' then connection.investments_available when 'reserves' then connection.reserves_available else false end,false) then return false; end if;
  return exists(select 1 from orbe_private.connection_reads where connection_id=p_connection_id and owner_id=p_owner_id
    and connection_revision=p_revision and lease_id=p_lease_id and completed_at is null and lease_expires_at > clock_timestamp());
end $$;

create function public.orbe_finish_connection_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_outcome text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare connection public.orbe_connections; prior orbe_private.connection_reads; instant timestamptz;
begin
  if p_outcome is null or p_outcome not in ('success','failed','cancelled') then return false; end if;
  select * into connection from public.orbe_connections where id=p_connection_id for update;
  if not found or not orbe_private.connection_read_eligible(connection,p_owner_id,p_revision) then return false; end if;
  select * into prior from orbe_private.connection_reads where connection_id=p_connection_id for update;
  instant := clock_timestamp();
  if not found or prior.owner_id<>p_owner_id or prior.connection_revision<>p_revision or prior.lease_id is distinct from p_lease_id
    or prior.completed_at is not null or prior.lease_expires_at <= instant then return false; end if;
  update orbe_private.connection_reads set completed_at=instant,outcome=p_outcome,lease_expires_at=instant where connection_id=p_connection_id;
  if p_outcome='success' then update public.orbe_connections set last_read_at=instant where id=p_connection_id; end if;
  return true;
end $$;

revoke all on function public.orbe_begin_connection_read(uuid,uuid,bigint) from public, anon, authenticated;
revoke all on function public.orbe_check_connection_read(uuid,uuid,bigint,uuid,text) from public, anon, authenticated;
revoke all on function public.orbe_finish_connection_read(uuid,uuid,bigint,uuid,text) from public, anon, authenticated;
grant execute on function public.orbe_begin_connection_read(uuid,uuid,bigint) to service_role;
grant execute on function public.orbe_check_connection_read(uuid,uuid,bigint,uuid,text) to service_role;
grant execute on function public.orbe_finish_connection_read(uuid,uuid,bigint,uuid,text) to service_role;
comment on function public.orbe_begin_connection_read(uuid,uuid,bigint) is 'Server-only read lease120s/cooldown900s. Caller must already verify Auth/owner and data gates.';
commit;
