begin;
create function orbe_private.session_action_allowed(p_require_recent boolean)
returns boolean language plpgsql security definer set search_path = '' set lock_timeout = '2s' as $$
declare
  v_user uuid := auth.uid();
  v_claims jsonb := auth.jwt();
  v_session_text text;
  v_created timestamptz;
  v_not_after timestamptz;
  v_now timestamptz := clock_timestamp();
  v_amr jsonb;
  v_entry jsonb;
  v_timestamp numeric;
  v_password boolean := false;
  v_recent_password boolean := false;
begin
  if p_require_recent is null or v_user is null or not public.orbe_is_owner() then return false; end if;
  if v_claims->>'role' is distinct from 'authenticated' or v_claims->'is_anonymous' is distinct from 'false'::jsonb then return false; end if;
  if jsonb_typeof(v_claims->'exp') is distinct from 'number' or coalesce(v_claims->>'exp','') !~ '^[0-9]{1,12}$' then return false; end if;
  if (v_claims->>'exp')::numeric <= extract(epoch from v_now) then return false; end if;
  v_session_text := v_claims->>'session_id';
  if v_session_text is null or v_session_text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then return false; end if;
  select s.created_at,s.not_after into v_created,v_not_after from auth.sessions s
    where s.id=v_session_text::uuid and s.user_id=v_user for share;
  if not found or v_created is null or v_created > v_now+interval '60 seconds' or (v_not_after is not null and v_not_after <= v_now) then return false; end if;
  if p_require_recent and v_created < v_now-interval '300 seconds' then return false; end if;
  v_amr := v_claims->'amr';
  if jsonb_typeof(v_amr) is distinct from 'array' then return false; end if;
  if jsonb_array_length(v_amr) < 1 or jsonb_array_length(v_amr) > 16 then return false; end if;
  for v_entry in select value from jsonb_array_elements(v_amr) loop
    if jsonb_typeof(v_entry) is distinct from 'object' or coalesce(v_entry->>'method','') not in ('password','totp','token_refresh') then return false; end if;
    if jsonb_typeof(v_entry->'timestamp') is distinct from 'number' or coalesce(v_entry->>'timestamp','') !~ '^[0-9]{1,12}$' then return false; end if;
    v_timestamp := (v_entry->>'timestamp')::numeric;
    if v_timestamp > extract(epoch from v_now)+60 then return false; end if;
    if v_entry->>'method'='password' then
      if v_timestamp < extract(epoch from v_created)-60 then return false; end if;
      v_password := true;
      if v_timestamp >= extract(epoch from v_now)-300 then v_recent_password := true; end if;
    end if;
  end loop;
  return v_password and (not p_require_recent or v_recent_password);
end;
$$;
revoke all on function orbe_private.session_action_allowed(boolean) from public,anon,authenticated,service_role;

create function public.orbe_pause_connection(p_connection_id uuid,p_revision bigint)
returns boolean language plpgsql security definer set search_path = '' set lock_timeout = '2s' as $$
declare v_connection public.orbe_connections;
begin
  if p_connection_id is null or p_revision is null or p_revision < 1 or p_revision >= 9007199254740991 or not orbe_private.session_action_allowed(false) then return false; end if;
  select * into v_connection from public.orbe_connections where id=p_connection_id and owner_id=auth.uid() for update;
  if not found or v_connection.revision<>p_revision then return false; end if;
  if v_connection.state='paused' then return true; end if;
  if v_connection.state<>'active' then return false; end if;
  update public.orbe_connections set state='paused' where id=v_connection.id;
  return true;
end;
$$;
create function public.orbe_remove_connection(p_connection_id uuid,p_revision bigint)
returns boolean language plpgsql security definer set search_path = '' set lock_timeout = '2s' as $$
declare v_connection public.orbe_connections;
begin
  if p_connection_id is null or p_revision is null or p_revision < 1 or p_revision > 9007199254740991 or not orbe_private.session_action_allowed(true) then return false; end if;
  select * into v_connection from public.orbe_connections where id=p_connection_id and owner_id=auth.uid() for update;
  if not found then return true; end if;
  if v_connection.revision<>p_revision then return false; end if;
  delete from public.orbe_connections where id=v_connection.id;
  return true;
end;
$$;
revoke all on function public.orbe_pause_connection(uuid,bigint),public.orbe_remove_connection(uuid,bigint) from public,anon,authenticated,service_role;
grant execute on function public.orbe_pause_connection(uuid,bigint),public.orbe_remove_connection(uuid,bigint) to authenticated;
comment on function public.orbe_pause_connection(uuid,bigint) is 'Owner password-session metadata pause with revision fencing; no provider call or resume.';
comment on function public.orbe_remove_connection(uuid,bigint) is 'Owner recent password-session unlink of Orbe metadata only; no bank/provider consent revocation.';
commit;
