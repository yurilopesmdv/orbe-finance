begin;
create or replace function public.orbe_finish_connection_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_outcome text)
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
  if p_outcome='success' and exists(select 1 from orbe_private.movement_page_reads m where m.connection_id=p_connection_id and m.lease_id=p_lease_id and (not m.finished or m.inflight_nonce is not null)) then return false; end if;
  update orbe_private.connection_reads set completed_at=instant,outcome=p_outcome,lease_expires_at=instant where connection_id=p_connection_id;
  if p_outcome='success' then update public.orbe_connections set last_read_at=instant where id=p_connection_id; end if;
  return true;
end $$;

create function public.orbe_finish_movement_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_session_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare progress orbe_private.movement_page_reads; session_digest text;
begin
  if not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'transactions') then return false; end if;
  session_digest:=orbe_private.movement_session_hash(p_owner_id,p_session_id);
  if session_digest is null then return false; end if;
  select * into progress from orbe_private.movement_page_reads where connection_id=p_connection_id for update;
  if not found or progress.owner_id is distinct from p_owner_id or progress.connection_revision is distinct from p_revision
    or progress.lease_id is distinct from p_lease_id or progress.session_hash is distinct from session_digest
    or not progress.finished or progress.inflight_nonce is not null
    or orbe_private.movement_session_hash(p_owner_id,p_session_id) is distinct from session_digest then return false; end if;
  return public.orbe_finish_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'success');
end $$;
revoke all on function public.orbe_finish_movement_read(uuid,uuid,bigint,uuid,uuid) from public,anon,authenticated;
grant execute on function public.orbe_finish_movement_read(uuid,uuid,bigint,uuid,uuid) to service_role;
comment on function public.orbe_finish_movement_read(uuid,uuid,bigint,uuid,uuid) is 'Transaction iteration finished for same live Auth session and lease only. Does not certify source coverage or bank completeness.';

commit;
