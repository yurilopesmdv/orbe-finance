begin;
alter table orbe_private.connection_reads add column product text check(product in ('accounts','transactions','investments'));
alter table orbe_private.connection_reads drop constraint connection_reads_check;
alter table orbe_private.connection_reads add constraint connection_reads_retry_after_start check(next_read_at>=started_at);
create table orbe_private.product_read_limits (
 connection_id uuid not null,owner_id uuid not null,product text not null check(product in ('accounts','transactions','investments')),
 next_read_at timestamptz not null,primary key(connection_id,product),
 foreign key(connection_id,owner_id) references public.orbe_connections(id,owner_id) on delete cascade
);
alter table orbe_private.product_read_limits enable row level security;
revoke all on orbe_private.product_read_limits from public,anon,authenticated,service_role;
comment on table orbe_private.product_read_limits is 'Technical per-product request admission only. No values, cursors or payloads. One active connection lease remains exclusive.';
create or replace function public.orbe_begin_connection_read(p_connection_id uuid,p_owner_id uuid,p_expected_revision bigint)
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
      lease_id=excluded.lease_id,started_at=excluded.started_at,lease_expires_at=excluded.lease_expires_at,next_read_at=excluded.next_read_at,completed_at=null,outcome=null,product=null;
  return jsonb_build_object('status','acquired','lease_id',identifier,'revision',connection.revision,'lease_expires_at',instant+interval '120 seconds','next_read_at',instant+interval '900 seconds');
end $$;

create or replace function public.orbe_check_connection_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_product text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare connection public.orbe_connections;
begin
  select * into connection from public.orbe_connections where id=p_connection_id for update;
  if not found or not orbe_private.connection_read_eligible(connection,p_owner_id,p_revision) then return false; end if;
  if not coalesce(case p_product when 'accounts' then connection.accounts_available when 'transactions' then connection.transactions_available
    when 'investments' then connection.investments_available when 'reserves' then connection.reserves_available else false end,false) then return false; end if;
  return exists(select 1 from orbe_private.connection_reads where connection_id=p_connection_id and owner_id=p_owner_id
    and (product is null or product=p_product) and connection_revision=p_revision and lease_id=p_lease_id and completed_at is null and lease_expires_at > clock_timestamp());
end $$;

create function public.orbe_begin_product_read(p_connection_id uuid,p_owner_id uuid,p_expected_revision bigint,p_product text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare conn public.orbe_connections;prior orbe_private.connection_reads;instant timestamptz;retry timestamptz;nonce uuid;
begin
 if p_product is null or p_product not in ('accounts','transactions','investments') then return jsonb_build_object('status','unavailable');end if;
 select * into conn from public.orbe_connections where id=p_connection_id for update;
 if not found or not orbe_private.connection_read_eligible(conn,p_owner_id,p_expected_revision)
 or not coalesce(case p_product when 'accounts' then conn.accounts_available when 'transactions' then conn.transactions_available when 'investments' then conn.investments_available end,false) then return jsonb_build_object('status','unavailable');end if;
 instant:=clock_timestamp();select * into prior from orbe_private.connection_reads where connection_id=p_connection_id for update;
 if found and prior.completed_at is null and prior.lease_expires_at>instant then return jsonb_build_object('status','busy');end if;
 select next_read_at into retry from orbe_private.product_read_limits where connection_id=p_connection_id and product=p_product for update;
 if found and retry>instant then return jsonb_build_object('status','cooldown','next_read_at',retry);end if;
 nonce:=gen_random_uuid();
 insert into orbe_private.product_read_limits(connection_id,owner_id,product,next_read_at) values(p_connection_id,p_owner_id,p_product,instant+interval '30 seconds')
 on conflict(connection_id,product) do update set next_read_at=excluded.next_read_at;
 insert into orbe_private.connection_reads(connection_id,owner_id,connection_revision,lease_id,started_at,lease_expires_at,next_read_at,product)
 values(p_connection_id,p_owner_id,conn.revision,nonce,instant,instant+interval '120 seconds',instant+interval '30 seconds',p_product)
 on conflict(connection_id) do update set owner_id=excluded.owner_id,connection_revision=excluded.connection_revision,lease_id=excluded.lease_id,started_at=excluded.started_at,lease_expires_at=excluded.lease_expires_at,next_read_at=excluded.next_read_at,completed_at=null,outcome=null,product=excluded.product;
 return jsonb_build_object('status','acquired','lease_id',nonce,'revision',conn.revision,'lease_expires_at',instant+interval '120 seconds','next_read_at',instant+interval '30 seconds');
end $$;
revoke all on function public.orbe_begin_product_read(uuid,uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.orbe_begin_product_read(uuid,uuid,bigint,text) to service_role;
comment on function public.orbe_begin_product_read(uuid,uuid,bigint,text) is 'Owner/revision/consent/capability guarded product admission30s with exclusive connection lease120s. Legacy begin API remains900s.';
commit;
