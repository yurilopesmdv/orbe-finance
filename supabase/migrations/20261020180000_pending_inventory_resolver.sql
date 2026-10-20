begin;
create function public.orbe_resolve_pending_inventory(p_owner_id uuid,p_connection_id uuid,p_revision bigint)
returns jsonb language sql security definer set search_path = '' as $$
 select jsonb_build_object('ownerId',c.owner_id,'connectionId',c.id,'revision',c.revision,'itemId',b.external_item_id)
 from public.orbe_connections c join orbe_private.connection_bindings b on b.connection_id=c.id and b.owner_id=c.owner_id
 where c.id=p_connection_id and c.owner_id=p_owner_id and c.revision=p_revision and c.state='pending'
 and exists(select 1 from orbe_private.app_owner where user_id=p_owner_id)
 and b.external_item_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
$$;
revoke all on function public.orbe_resolve_pending_inventory(uuid,uuid,bigint) from public,anon,authenticated;
grant execute on function public.orbe_resolve_pending_inventory(uuid,uuid,bigint) to service_role;
comment on function public.orbe_resolve_pending_inventory(uuid,uuid,bigint) is 'Server-only pending inventory context, no authorization to read finances or activate. Caller must independently enforce approval and provisioning policy.';
commit;
