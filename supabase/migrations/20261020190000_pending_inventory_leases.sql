begin;
create function public.orbe_begin_pending_inventory(p_connection_id uuid,p_owner_id uuid,p_expected_revision bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare conn public.orbe_connections; prior orbe_private.connection_reads; instant timestamptz; nonce uuid;
begin
 perform 1 from orbe_private.app_owner where user_id=p_owner_id for update;
 if not found then return jsonb_build_object('status','unavailable');end if;
 select * into conn from public.orbe_connections where id=p_connection_id and owner_id=p_owner_id for update;
 if not found or conn.state<>'pending' or conn.revision is distinct from p_expected_revision or not exists(select 1 from orbe_private.connection_bindings where connection_id=p_connection_id and owner_id=p_owner_id) then return jsonb_build_object('status','unavailable');end if;
 instant:=clock_timestamp();
 select * into prior from orbe_private.connection_reads where connection_id=p_connection_id for update;
 if found then
  if prior.connection_revision=conn.revision and prior.completed_at is null and prior.lease_expires_at>instant then return jsonb_build_object('status','busy');end if;
  if prior.next_read_at>instant then return jsonb_build_object('status','cooldown','next_read_at',prior.next_read_at);end if;
 end if;
 nonce:=gen_random_uuid();
 insert into orbe_private.connection_reads(connection_id,owner_id,connection_revision,lease_id,started_at,lease_expires_at,next_read_at)
 values(p_connection_id,p_owner_id,conn.revision,nonce,instant,instant+interval '120 seconds',instant+interval '900 seconds')
 on conflict(connection_id) do update set owner_id=excluded.owner_id,connection_revision=excluded.connection_revision,lease_id=excluded.lease_id,started_at=excluded.started_at,lease_expires_at=excluded.lease_expires_at,next_read_at=excluded.next_read_at,completed_at=null,outcome=null;
 return jsonb_build_object('status','acquired','lease_id',nonce,'revision',conn.revision,'lease_expires_at',instant+interval '120 seconds','next_read_at',instant+interval '900 seconds');
end $$;
create function public.orbe_check_pending_inventory(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare conn public.orbe_connections;
begin
 perform 1 from orbe_private.app_owner where user_id=p_owner_id for update;
 if not found then return false;end if;
 select * into conn from public.orbe_connections where id=p_connection_id and owner_id=p_owner_id for update;
 if not found or conn.state<>'pending' or conn.revision is distinct from p_revision then return false;end if;
 return exists(select 1 from orbe_private.connection_reads where connection_id=p_connection_id and owner_id=p_owner_id and connection_revision=p_revision and lease_id=p_lease_id and completed_at is null and lease_expires_at>clock_timestamp());
end $$;
create function public.orbe_commit_pending_inventory(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_item_id uuid,p_accounts jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare expiry timestamptz;instant timestamptz;
begin
 if not public.orbe_check_pending_inventory(p_connection_id,p_owner_id,p_revision,p_lease_id) then return false;end if;
 select lease_expires_at into expiry from orbe_private.connection_reads where connection_id=p_connection_id;
 if not public.orbe_stage_account_bindings(p_owner_id,p_connection_id,p_revision,p_item_id,p_accounts) then return false;end if;
 instant:=clock_timestamp();
 if instant>=expiry then raise exception using errcode='P0001',message='pending_inventory_lease_expired';end if;
 update orbe_private.connection_reads set completed_at=instant,outcome='success',lease_expires_at=instant where connection_id=p_connection_id;
 return true;
end $$;
revoke all on function public.orbe_begin_pending_inventory(uuid,uuid,bigint),public.orbe_check_pending_inventory(uuid,uuid,bigint,uuid),public.orbe_commit_pending_inventory(uuid,uuid,bigint,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.orbe_begin_pending_inventory(uuid,uuid,bigint),public.orbe_check_pending_inventory(uuid,uuid,bigint,uuid),public.orbe_commit_pending_inventory(uuid,uuid,bigint,uuid,uuid,jsonb) to service_role;
comment on function public.orbe_commit_pending_inventory(uuid,uuid,bigint,uuid,uuid,jsonb) is 'Atomically stores pending account metadata under current discovery lease and finishes it. Does not activate or update financial read timestamp.';
commit;
