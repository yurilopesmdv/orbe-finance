begin;
create table public.orbe_positions (
 id uuid primary key default gen_random_uuid(),
 connection_id uuid not null,
 owner_id uuid not null,
 product text not null default 'investment' check(product='investment'),
 created_at timestamptz not null default now(),
 unique(id,connection_id,owner_id),
 foreign key(connection_id,owner_id) references public.orbe_connections(id,owner_id) on delete cascade
);
create index orbe_positions_connection_owner_idx on public.orbe_positions(connection_id,owner_id);
create table orbe_private.position_bindings (
 position_id uuid primary key,
 connection_id uuid not null,
 owner_id uuid not null,
 external_position_id uuid not null unique,
 foreign key(position_id,connection_id,owner_id) references public.orbe_positions(id,connection_id,owner_id) on delete cascade
);
alter table public.orbe_positions enable row level security;
alter table orbe_private.position_bindings enable row level security;
revoke all on public.orbe_positions,orbe_private.position_bindings from public,anon,authenticated;
grant select on public.orbe_positions to authenticated;
grant select,insert,update,delete on public.orbe_positions,orbe_private.position_bindings to service_role;
create policy orbe_positions_owner_read on public.orbe_positions for select to authenticated
 using((select public.orbe_has_session()) and owner_id=(select auth.uid()));
comment on table public.orbe_positions is 'Opaque position registry only. No financial values, names, codes, classes, account numbers or holder PII. Investment does not imply a reserve.';
comment on table orbe_private.position_bindings is 'Private investment UUID mapping. No values, names, credentials, rebinding or source coverage approval.';

create function public.orbe_stage_position_bindings(p_owner_id uuid,p_connection_id uuid,p_revision bigint,p_item_id uuid,p_lease_id uuid,p_session_id uuid,p_positions jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare row_value jsonb; external_id uuid; internal_id uuid; amount integer;
begin
 if p_item_id is null or jsonb_typeof(p_positions) is distinct from 'array' then return false;end if;
 amount:=jsonb_array_length(p_positions);if amount>1000 then return false;end if;
 if not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'investments')
   or orbe_private.movement_session_hash(p_owner_id,p_session_id) is null then return false;end if;
 if not exists(select 1 from orbe_private.connection_bindings where connection_id=p_connection_id and owner_id=p_owner_id and external_item_id=p_item_id::text) then return false;end if;
 for row_value in select value from jsonb_array_elements(p_positions) loop
  if jsonb_typeof(row_value) is distinct from 'object' then return false;end if;
  if (select count(*) from jsonb_object_keys(row_value))<>1 or not row_value?'externalId'
    or jsonb_typeof(row_value->'externalId') is distinct from 'string' or length(row_value->>'externalId')<>36
    or row_value->>'externalId'!~'^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then return false;end if;
  external_id:=(row_value->>'externalId')::uuid;
  if exists(select 1 from orbe_private.position_bindings where external_position_id=external_id and (connection_id<>p_connection_id or owner_id<>p_owner_id)) then return false;end if;
 end loop;
 if amount<>(select count(distinct value->>'externalId') from jsonb_array_elements(p_positions)) then return false;end if;
 if (select count(*) from orbe_private.position_bindings where connection_id=p_connection_id and owner_id=p_owner_id)
  +(select count(*) from jsonb_array_elements(p_positions) v where not exists(select 1 from orbe_private.position_bindings b where b.connection_id=p_connection_id and b.external_position_id=(v.value->>'externalId')::uuid))>1000 then return false;end if;
 for row_value in select value from jsonb_array_elements(p_positions) loop
  external_id:=(row_value->>'externalId')::uuid;
  if not exists(select 1 from orbe_private.position_bindings where connection_id=p_connection_id and external_position_id=external_id) then
   insert into public.orbe_positions(connection_id,owner_id) values(p_connection_id,p_owner_id) returning id into internal_id;
   insert into orbe_private.position_bindings(position_id,connection_id,owner_id,external_position_id) values(internal_id,p_connection_id,p_owner_id,external_id);
  end if;
 end loop;
 if not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'investments')
   or orbe_private.movement_session_hash(p_owner_id,p_session_id) is null then raise exception using errcode='Z0001';end if;
 return true;
exception when sqlstate 'Z0001' or unique_violation then return false;
end $$;
revoke all on function public.orbe_stage_position_bindings(uuid,uuid,bigint,uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.orbe_stage_position_bindings(uuid,uuid,bigint,uuid,uuid,uuid,jsonb) to service_role;

create function public.orbe_resolve_investment_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_session_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare connection public.orbe_connections;lease orbe_private.connection_reads;item text;rows jsonb;amount integer;
begin
 if not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'investments')
  or orbe_private.movement_session_hash(p_owner_id,p_session_id) is null then return null;end if;
 select * into lease from orbe_private.connection_reads where connection_id=p_connection_id for update;
 if not found or lease.owner_id is distinct from p_owner_id or lease.connection_revision is distinct from p_revision or lease.lease_id is distinct from p_lease_id or lease.completed_at is not null or lease.lease_expires_at<=clock_timestamp() then return null;end if;
 select * into connection from public.orbe_connections where id=p_connection_id and owner_id=p_owner_id;
 select external_item_id into item from orbe_private.connection_bindings where connection_id=p_connection_id and owner_id=p_owner_id;
 if item is null then return null;end if;
 select count(*) into amount from orbe_private.position_bindings where connection_id=p_connection_id and owner_id=p_owner_id;
 if amount>1000 then return null;end if;
 select coalesce(jsonb_agg(jsonb_build_object('externalId',b.external_position_id,'internalId',b.position_id) order by b.position_id),'[]'::jsonb) into rows
  from orbe_private.position_bindings b join public.orbe_positions p on p.id=b.position_id and p.connection_id=b.connection_id and p.owner_id=b.owner_id and p.product='investment'
  where b.connection_id=p_connection_id and b.owner_id=p_owner_id;
 if jsonb_array_length(rows) is distinct from amount or lease.lease_expires_at<=clock_timestamp() or orbe_private.movement_session_hash(p_owner_id,p_session_id) is null then return null;end if;
 return jsonb_build_object('ownerId',p_owner_id,'sessionId',p_session_id,'connectionId',p_connection_id,'revision',p_revision,'leaseId',p_lease_id,'leaseExpiresAt',lease.lease_expires_at,
  'projection',jsonb_build_object('itemId',item,'connectionId',p_connection_id,'bindings',rows,'sourceUpdatedAt',connection.source_updated_at));
end $$;
revoke all on function public.orbe_resolve_investment_read(uuid,uuid,bigint,uuid,uuid) from public,anon,authenticated;
grant execute on function public.orbe_resolve_investment_read(uuid,uuid,bigint,uuid,uuid) to service_role;
commit;
