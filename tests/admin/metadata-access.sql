begin;
set local statement_timeout='15s';
set local lock_timeout='2s';
do $test$
begin
  if has_function_privilege('anon','public.orbe_has_session()','execute') or has_function_privilege('service_role','public.orbe_has_session()','execute') or has_function_privilege('authenticated','orbe_private.session_action_allowed(boolean,boolean)','execute') then raise exception 'metadata_session_acl_open'; end if;
  if exists(select 1 from auth.users where id in ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012')) or exists(select 1 from auth.sessions where id in ('70000000-0000-4000-8000-000000000011','70000000-0000-4000-8000-000000000012')) then
    raise exception 'metadata_test_identity_collision';
  end if;
end $test$;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000011'),('00000000-0000-4000-8000-000000000012');
insert into auth.sessions(id,user_id,created_at) values
('70000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000011',clock_timestamp()-interval '10 seconds'),
('70000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000012',clock_timestamp()-interval '10 seconds');
select set_config('orbe.test_claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000011','role','authenticated','is_anonymous',false,'exp',floor(extract(epoch from clock_timestamp()))+600,'session_id','70000000-0000-4000-8000-000000000011','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from clock_timestamp()))-10)))::text,true);
insert into orbe_private.app_owner(singleton,user_id) values(true,'00000000-0000-4000-8000-000000000011') on conflict(singleton) do update set user_id=excluded.user_id;
insert into public.orbe_connections(id,owner_id,institution,accounts_available,investments_available) values
('10000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000011','bradesco',true,null),
('10000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000012','mercado-pago',true,false);
insert into public.orbe_accounts(id,connection_id,owner_id,kind,currency) values
('20000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000011','checking','BRL'),
('20000000-0000-4000-8000-000000000012','10000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000012','payment','BRL');
insert into orbe_private.connection_bindings(connection_id,owner_id,external_item_id) values
('10000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000011','synthetic-item-one'),
('10000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000012','synthetic-item-two');
insert into orbe_private.account_bindings(account_id,connection_id,owner_id,external_account_id) values
('20000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000011','synthetic-account-one');
do $test$
begin
  if (select investments_available from public.orbe_connections where id='10000000-0000-4000-8000-000000000011') is not null then raise exception 'unknown_capability_changed'; end if;
  if (select investments_available from public.orbe_connections where id='10000000-0000-4000-8000-000000000012') is distinct from false then raise exception 'unsupported_capability_changed'; end if;
  begin
    insert into public.orbe_accounts(connection_id,owner_id) values('10000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012');
    raise exception 'cross_owner_account_allowed';
  exception when foreign_key_violation then null; end;
  begin
    update orbe_private.connection_bindings set owner_id='00000000-0000-4000-8000-000000000012' where connection_id='10000000-0000-4000-8000-000000000011';
    raise exception 'cross_owner_item_allowed';
  exception when foreign_key_violation then null; end;
  begin
    update orbe_private.account_bindings set connection_id='10000000-0000-4000-8000-000000000012',owner_id='00000000-0000-4000-8000-000000000012' where account_id='20000000-0000-4000-8000-000000000011';
    raise exception 'cross_connection_binding_allowed';
  exception when foreign_key_violation then null; end;
  begin
    update orbe_private.connection_bindings set external_item_id='synthetic-item-one' where connection_id='10000000-0000-4000-8000-000000000012';
    raise exception 'duplicate_item_binding_allowed';
  exception when unique_violation then null; end;
  begin
    update public.orbe_connections set state='active' where id='10000000-0000-4000-8000-000000000011';
    raise exception 'unverified_open_finance_activation_allowed';
  exception when check_violation then null; end;
end $test$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000011',true);
select set_config('request.jwt.claims',current_setting('orbe.test_claims'),true);
do $test$
begin
  if not public.orbe_is_owner() or not public.orbe_has_session() then raise exception 'metadata_owner_denied'; end if;
  if (select count(*) from public.orbe_connections) <> 1 or (select count(*) from public.orbe_accounts) <> 1 then raise exception 'metadata_owner_filter_failed'; end if;
  if (select count(*) from public.orbe_accounts a join public.orbe_connections c on c.id=a.connection_id) <> 1 then raise exception 'metadata_join_filter_failed'; end if;
  if (select count(*) from public.orbe_connections where id='10000000-0000-4000-8000-000000000012') <> 0 then raise exception 'metadata_other_id_visible'; end if;
  begin
    insert into public.orbe_connections(owner_id,institution) values('00000000-0000-4000-8000-000000000011','bradesco');
    raise exception 'client_connection_insert_allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.orbe_connections set state='paused';
    raise exception 'client_connection_update_allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.orbe_accounts;
    raise exception 'client_account_delete_allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform external_item_id from orbe_private.connection_bindings;
    raise exception 'client_external_item_visible';
  exception when insufficient_privilege then null; end;
  begin
    perform external_account_id from orbe_private.account_bindings;
    raise exception 'client_external_account_visible';
  exception when insufficient_privilege then null; end;
end $test$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000012',true);
select set_config('request.jwt.claims',(current_setting('orbe.test_claims')::jsonb||jsonb_build_object('sub','00000000-0000-4000-8000-000000000012','session_id','70000000-0000-4000-8000-000000000012'))::text,true);
do $test$
begin
  if public.orbe_is_owner() then raise exception 'second_identity_owner_allowed'; end if;
  if (select count(*) from public.orbe_connections) <> 0 or (select count(*) from public.orbe_accounts) <> 0 then raise exception 'second_identity_metadata_visible'; end if;
  if (select count(*) from public.orbe_accounts a join public.orbe_connections c on c.id=a.connection_id) <> 0 then raise exception 'second_identity_join_visible'; end if;
end $test$;
reset role;
set local role anon;
do $test$
begin
  begin
    perform count(*) from public.orbe_connections;
    raise exception 'anonymous_metadata_allowed';
  exception when insufficient_privilege then null; end;
end $test$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000011',true);
select set_config('request.jwt.claims',current_setting('orbe.test_claims'),true);
set local role authenticated;
do $test$
declare v_patch jsonb; v_base jsonb := current_setting('orbe.test_claims')::jsonb;
begin
  for v_patch in select value from jsonb_array_elements(jsonb_build_array(
    jsonb_build_object('exp',0),jsonb_build_object('is_anonymous',true),jsonb_build_object('sub','00000000-0000-4000-8000-000000000012'),
    jsonb_build_object('session_id','bad'),jsonb_build_object('session_id','70000000-0000-4000-8000-000000000012'),jsonb_build_object('amr',null),
    jsonb_build_object('amr',jsonb_build_array(jsonb_build_object('method','recovery','timestamp',floor(extract(epoch from clock_timestamp())))))
  )) loop
    perform set_config('request.jwt.claims',(v_base||v_patch)::text,true);
    if not public.orbe_is_owner() then raise exception 'metadata_identity_context_changed'; end if;
    if public.orbe_has_session() or (select count(*) from public.orbe_connections)<>0 or (select count(*) from public.orbe_accounts)<>0 then raise exception 'metadata_invalid_session_visible'; end if;
  end loop;
  perform set_config('request.jwt.claims',v_base::text,true);
end $test$;
reset role;
delete from auth.sessions where id='70000000-0000-4000-8000-000000000011';
set local role authenticated;
do $test$ begin
  if not public.orbe_is_owner() then raise exception 'metadata_identity_owner_lost'; end if;
  if public.orbe_has_session() or (select count(*) from public.orbe_connections)<>0 or (select count(*) from public.orbe_accounts)<>0 then raise exception 'metadata_signedout_session_visible'; end if;
end $test$;
reset role;
insert into auth.sessions(id,user_id,created_at,not_after) values('70000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000011',clock_timestamp()-interval '10 seconds',clock_timestamp()-interval '1 second');
set local role authenticated;
do $test$ begin
  if public.orbe_has_session() or (select count(*) from public.orbe_connections)<>0 then raise exception 'metadata_expired_session_visible'; end if;
end $test$;
reset role;
update auth.sessions set not_after=null,created_at=null where id='70000000-0000-4000-8000-000000000011';
set local role authenticated;
do $test$ begin if public.orbe_has_session() then raise exception 'metadata_unknown_session_date_allowed'; end if; end $test$;
reset role;
update auth.sessions set created_at=clock_timestamp()+interval '1 hour' where id='70000000-0000-4000-8000-000000000011';
set local role authenticated;
do $test$ begin if public.orbe_has_session() then raise exception 'metadata_future_session_date_allowed'; end if; end $test$;
reset role;
update auth.sessions set created_at=clock_timestamp()-interval '10 seconds' where id='70000000-0000-4000-8000-000000000011';
set local role authenticated;
set transaction read only;
do $test$ begin
  if current_setting('transaction_read_only')<>'on' then raise exception 'metadata_readonly_mode_missing'; end if;
  if not public.orbe_has_session() or (select count(*) from public.orbe_connections)<>1 or (select count(*) from public.orbe_accounts)<>1 then raise exception 'metadata_readonly_owner_denied'; end if;
  if (select count(*) from public.orbe_accounts a join public.orbe_connections c on c.id=a.connection_id)<>1 then raise exception 'metadata_readonly_join_denied'; end if;
end $test$;
reset role;
rollback;
