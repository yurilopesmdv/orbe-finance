begin;
create function public.orbe_resolve_movement_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_session_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare connection public.orbe_connections; lease orbe_private.connection_reads; item text; rows jsonb; amount integer;
begin
  if not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'transactions') then return null; end if;
  select * into lease from orbe_private.connection_reads where connection_id=p_connection_id for update;
  if not found or lease.owner_id is distinct from p_owner_id or lease.connection_revision is distinct from p_revision
    or lease.lease_id is distinct from p_lease_id or lease.completed_at is not null or lease.lease_expires_at<=clock_timestamp()
    or orbe_private.movement_session_hash(p_owner_id,p_session_id) is null then return null; end if;
  select * into connection from public.orbe_connections where id=p_connection_id and owner_id=p_owner_id;
  select external_item_id into item from orbe_private.connection_bindings where connection_id=p_connection_id and owner_id=p_owner_id;
  if item is null then return null; end if;
  select count(*) into amount from orbe_private.account_bindings where connection_id=p_connection_id and owner_id=p_owner_id;
  if amount<1 or amount>100 then return null; end if;
  select jsonb_agg(jsonb_build_object('externalId',b.external_account_id,'internalId',b.account_id,
    'balanceAsOf',null,'relation','unknown') order by b.account_id) into rows
    from orbe_private.account_bindings b join public.orbe_accounts a on a.id=b.account_id and a.connection_id=b.connection_id and a.owner_id=b.owner_id
    where b.connection_id=p_connection_id and b.owner_id=p_owner_id;
  if jsonb_array_length(rows) is distinct from amount or lease.lease_expires_at<=clock_timestamp()
    or orbe_private.movement_session_hash(p_owner_id,p_session_id) is null then return null; end if;
  return jsonb_build_object('ownerId',p_owner_id,'sessionId',p_session_id,'connectionId',p_connection_id,'revision',p_revision,
    'leaseId',p_lease_id,'leaseExpiresAt',lease.lease_expires_at,
    'projection',jsonb_build_object('itemId',item,'connectionId',p_connection_id,'bindings',rows,
      'sourceUpdatedAt',connection.source_updated_at,'coverageApproved',false));
end $$;
revoke all on function public.orbe_resolve_movement_read(uuid,uuid,bigint,uuid,uuid) from public,anon,authenticated;
grant execute on function public.orbe_resolve_movement_read(uuid,uuid,bigint,uuid,uuid) to service_role;
comment on function public.orbe_resolve_movement_read(uuid,uuid,bigint,uuid,uuid) is 'Internal transaction bindings only after registered owner, current Auth session, transactions consent/capability and actual lease validation. No values, PII or coverage proof.';
commit;
