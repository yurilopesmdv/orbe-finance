begin;
create function public.orbe_resolve_account_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare connection public.orbe_connections; item text; rows jsonb; amount integer;
begin
  -- The existing check locks the connection and validates registered owner,
  -- revision, active state, consent expiry, capability and current read lease.
  if not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'accounts') then return null; end if;
  select * into connection from public.orbe_connections where id=p_connection_id and owner_id=p_owner_id;
  select external_item_id into item from orbe_private.connection_bindings where connection_id=p_connection_id and owner_id=p_owner_id;
  if item is null then return null; end if;
  select count(*) into amount from orbe_private.account_bindings where connection_id=p_connection_id and owner_id=p_owner_id;
  if amount > 1000 then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('externalId',b.external_account_id,'internalId',b.account_id,
    'balanceAsOf',null,'relation','unknown') order by b.account_id),'[]'::jsonb) into rows
    from orbe_private.account_bindings b join public.orbe_accounts a on a.id=b.account_id and a.connection_id=b.connection_id and a.owner_id=b.owner_id
    where b.connection_id=p_connection_id and b.owner_id=p_owner_id;
  return jsonb_build_object('ownerId',p_owner_id,'connectionId',p_connection_id,'revision',p_revision,
    'projection',jsonb_build_object('itemId',item,'connectionId',p_connection_id,'bindings',rows,
      'sourceUpdatedAt',connection.source_updated_at,'coverageApproved',false));
end $$;
revoke all on function public.orbe_resolve_account_read(uuid,uuid,bigint,uuid) from public,anon,authenticated;
grant execute on function public.orbe_resolve_account_read(uuid,uuid,bigint,uuid) to service_role;
comment on function public.orbe_resolve_account_read(uuid,uuid,bigint,uuid) is 'Server-only technical bindings after owner/session verified by caller and accounts lease checked here. No balances, PII, automatic provisioning or coverage proof.';
commit;
