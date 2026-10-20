begin;
create function public.orbe_stage_connection(p_owner_id uuid, p_institution text, p_item_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare existing public.orbe_connections; new_id uuid;
begin
  if p_owner_id is null or p_item_id is null or p_item_id='00000000-0000-0000-0000-000000000000'::uuid
     or p_institution is null or p_institution not in ('bradesco','mercado-pago') then return false; end if;
  -- Serialize staging for the registered owner; never replace that owner.
  perform 1 from orbe_private.app_owner where user_id=p_owner_id for update;
  if not found then return false; end if;
  if exists(select 1 from orbe_private.connection_bindings b join public.orbe_connections c on c.id=b.connection_id
    where b.external_item_id=p_item_id::text and (b.owner_id<>p_owner_id or c.institution<>p_institution)) then return false; end if;
  if (select count(*) from public.orbe_connections where owner_id=p_owner_id and institution=p_institution)>1 then return false; end if;
  select * into existing from public.orbe_connections where owner_id=p_owner_id and institution=p_institution for update;
  if found then
    return existing.state='pending' and exists(select 1 from orbe_private.connection_bindings
      where connection_id=existing.id and owner_id=p_owner_id and external_item_id=p_item_id::text);
  end if;
  insert into public.orbe_connections(owner_id,institution,state) values(p_owner_id,p_institution,'pending') returning id into new_id;
  insert into orbe_private.connection_bindings(connection_id,owner_id,external_item_id) values(new_id,p_owner_id,p_item_id::text);
  return true;
end $$;
revoke all on function public.orbe_stage_connection(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.orbe_stage_connection(uuid,text,uuid) to service_role;
comment on function public.orbe_stage_connection(uuid,text,uuid) is 'Stages pending metadata and private item binding only. Does not verify bank, consent, capabilities or enable reads; exact pending repeats only.';
commit;
