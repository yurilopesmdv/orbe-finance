begin;
-- Artificial identities exist only inside this transaction. Never select email/password.
do $test$
begin
  if exists(select 1 from auth.users where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002')) then
    raise exception 'test_identity_collision';
  end if;
  if has_function_privilege('anon','public.orbe_is_owner()','execute') then
    raise exception 'anonymous_function_access';
  end if;
  if not has_function_privilege('authenticated','public.orbe_is_owner()','execute') then
    raise exception 'authenticated_function_missing';
  end if;
  if has_table_privilege('authenticated','orbe_private.app_owner','select,insert,update,delete') or has_schema_privilege('authenticated','orbe_private','usage') then
    raise exception 'client_owner_registry_access';
  end if;
end $test$;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
-- Existing owner is replaced only within a transaction that always rolls back.
insert into orbe_private.app_owner(singleton,user_id) values(true,'00000000-0000-4000-8000-000000000001')
on conflict(singleton) do update set user_id=excluded.user_id;
set local role authenticated;
do $test$
begin
  perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
  if not public.orbe_is_owner() then raise exception 'owner_denied'; end if;
  perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
  if public.orbe_is_owner() then raise exception 'other_identity_allowed'; end if;
  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claims','{}',true);
  if public.orbe_is_owner() then raise exception 'no_session_allowed'; end if;
end $test$;
reset role;
delete from orbe_private.app_owner;
set local role authenticated;
do $test$
begin
  perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
  if public.orbe_is_owner() then raise exception 'unprovisioned_identity_allowed'; end if;
end $test$;
reset role;
set local role anon;
do $test$
begin
  begin
    perform public.orbe_is_owner();
    raise exception 'anonymous_call_allowed';
  exception when insufficient_privilege then null;
  end;
end $test$;
reset role;
rollback;
