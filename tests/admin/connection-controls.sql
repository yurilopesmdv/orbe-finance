begin;
set local statement_timeout='15s';
set local lock_timeout='2s';
do $test$
begin
  if exists(select 1 from auth.users where id in ('00000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000072'))
    or exists(select 1 from auth.sessions where id in ('70000000-0000-4000-8000-000000000071','70000000-0000-4000-8000-000000000072'))
    or exists(select 1 from public.orbe_connections where id in ('10000000-0000-4000-8000-000000000071','10000000-0000-4000-8000-000000000072','10000000-0000-4000-8000-000000000073','10000000-0000-4000-8000-000000000074')) then raise exception 'controls_fixture_collision'; end if;
end $test$;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000071'),('00000000-0000-4000-8000-000000000072');
insert into auth.sessions(id,user_id,created_at) values
('70000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000071',clock_timestamp()-interval '10 seconds'),
('70000000-0000-4000-8000-000000000072','00000000-0000-4000-8000-000000000072',clock_timestamp()-interval '10 seconds');
insert into orbe_private.app_owner(singleton,user_id) values(true,'00000000-0000-4000-8000-000000000071') on conflict(singleton) do update set user_id=excluded.user_id;
insert into public.orbe_connections(id,owner_id,institution,state,accounts_available,open_finance_verified_at,proxy_consent_expires_at) values
('10000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000071','bradesco','active',true,clock_timestamp()-interval '1 day',clock_timestamp()+interval '1 day'),
('10000000-0000-4000-8000-000000000072','00000000-0000-4000-8000-000000000072','mercado-pago','active',true,clock_timestamp()-interval '1 day',clock_timestamp()+interval '1 day'),
('10000000-0000-4000-8000-000000000073','00000000-0000-4000-8000-000000000071','inter','pending',null,null,null),
('10000000-0000-4000-8000-000000000074','00000000-0000-4000-8000-000000000071','nubank','active',true,clock_timestamp()-interval '1 day',clock_timestamp()+interval '1 day');
insert into public.orbe_accounts(id,connection_id,owner_id) values('20000000-0000-4000-8000-000000000071','10000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000071');
insert into orbe_private.connection_bindings(connection_id,owner_id,external_item_id) values('10000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000071','invented-control-item');
insert into orbe_private.account_bindings(account_id,connection_id,owner_id,external_account_id) values('20000000-0000-4000-8000-000000000071','10000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000071','invented-control-account');
select set_config('orbe.test_claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000071','role','authenticated','is_anonymous',false,'exp',floor(extract(epoch from clock_timestamp()))+600,'session_id','70000000-0000-4000-8000-000000000071','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from clock_timestamp()))-10)))::text,true);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000071',true);
select set_config('request.jwt.claims',current_setting('orbe.test_claims'),true);

do $test$
begin
  if has_function_privilege('anon','public.orbe_pause_connection(uuid,bigint)','execute') or has_function_privilege('anon','public.orbe_remove_connection(uuid,bigint)','execute')
    or has_function_privilege('service_role','public.orbe_pause_connection(uuid,bigint)','execute') or has_function_privilege('service_role','public.orbe_remove_connection(uuid,bigint)','execute') then raise exception 'controls_acl_open'; end if;
  if has_function_privilege('authenticated','orbe_private.session_action_allowed(boolean)','execute') or has_function_privilege('service_role','orbe_private.session_action_allowed(boolean)','execute')
    or has_table_privilege('authenticated','auth.sessions','select') or has_table_privilege('authenticated','public.orbe_connections','delete') or has_table_privilege('authenticated','public.orbe_connections','update') then raise exception 'controls_direct_access'; end if;
end $test$;
set local role anon;
do $test$ begin
  begin perform public.orbe_pause_connection('10000000-0000-4000-8000-000000000071',1); raise exception 'controls_anon_pause'; exception when insufficient_privilege then null; end;
  begin perform public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',1); raise exception 'controls_anon_remove'; exception when insufficient_privilege then null; end;
end $test$;
reset role;
set local role service_role;
do $test$ begin
  begin perform public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',1); raise exception 'controls_service_remove'; exception when insufficient_privilege then null; end;
end $test$;
reset role;
set local role authenticated;
do $test$
declare v_patch jsonb; v_base jsonb := current_setting('orbe.test_claims')::jsonb;
begin
  for v_patch in select value from jsonb_array_elements(jsonb_build_array(
    jsonb_build_object('exp',0),jsonb_build_object('exp','999999999999'),jsonb_build_object('is_anonymous',true),jsonb_build_object('role','service_role'),
    jsonb_build_object('session_id','bad'),jsonb_build_object('session_id','70000000-0000-4000-8000-000000000099'),jsonb_build_object('session_id','70000000-0000-4000-8000-000000000072'),
    jsonb_build_object('amr',null),jsonb_build_object('amr',jsonb_build_object('method','password')),jsonb_build_object('amr','[]'::jsonb),
    jsonb_build_object('amr','[{"method":"password","timestamp":"123"}]'::jsonb),jsonb_build_object('amr','[{"method":"password","timestamp":-1}]'::jsonb),
    jsonb_build_object('amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from clock_timestamp()))+3600))),
    jsonb_build_object('amr',jsonb_build_array(jsonb_build_object('method','recovery','timestamp',floor(extract(epoch from clock_timestamp()))))),
    jsonb_build_object('amr',(v_base->'amr')||jsonb_build_array(jsonb_build_object('method','recovery','timestamp',floor(extract(epoch from clock_timestamp()))))),
    jsonb_build_object('amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from clock_timestamp()))-600))),
    jsonb_build_object('amr',jsonb_build_array(jsonb_build_object('method','token_refresh','timestamp',floor(extract(epoch from clock_timestamp())))))
  )) loop
    perform set_config('request.jwt.claims',(v_base||v_patch)::text,true);
    if public.orbe_pause_connection('10000000-0000-4000-8000-000000000071',1) or public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',1) then raise exception 'controls_invalid_claims_allowed'; end if;
  end loop;
  perform set_config('request.jwt.claims',(v_base-'amr')::text,true);
  if public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',1) then raise exception 'controls_missing_amr_allowed'; end if;
  perform set_config('request.jwt.claims',v_base::text,true);
  if public.orbe_pause_connection('10000000-0000-4000-8000-000000000072',1) or public.orbe_pause_connection('10000000-0000-4000-8000-000000000073',1) then raise exception 'controls_foreign_pending_pause'; end if;
  if public.orbe_pause_connection(null,1) or public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',0) then raise exception 'controls_invalid_scope_allowed'; end if;
end $test$;
reset role;
-- Another authenticated identity cannot operate even on its own row.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000072',true);
select set_config('request.jwt.claims',(current_setting('orbe.test_claims')::jsonb||jsonb_build_object('sub','00000000-0000-4000-8000-000000000072','session_id','70000000-0000-4000-8000-000000000072'))::text,true);
set local role authenticated;
do $test$ begin
  if public.orbe_pause_connection('10000000-0000-4000-8000-000000000072',1) or public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',1) then raise exception 'controls_nonowner_allowed'; end if;
end $test$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000071',true);
select set_config('request.jwt.claims',current_setting('orbe.test_claims'),true);
update auth.sessions set created_at=clock_timestamp()-interval '10 minutes' where id='70000000-0000-4000-8000-000000000071';
select set_config('request.jwt.claims',(current_setting('orbe.test_claims')::jsonb||jsonb_build_object('iat',floor(extract(epoch from clock_timestamp())),'amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from clock_timestamp()))-600))))::text,true);
set local role authenticated;
do $test$ begin
  if public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',1) then raise exception 'controls_old_session_recent_token_allowed'; end if;
  if not public.orbe_pause_connection('10000000-0000-4000-8000-000000000074',1) then raise exception 'controls_pause_requires_unnecessary_reauth'; end if;
end $test$;
reset role;
select set_config('request.jwt.claims',current_setting('orbe.test_claims'),true);
update auth.sessions set created_at=clock_timestamp()-interval '10 seconds',not_after=clock_timestamp()-interval '1 second' where id='70000000-0000-4000-8000-000000000071';
set local role authenticated;
do $test$ begin if public.orbe_pause_connection('10000000-0000-4000-8000-000000000071',1) or public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',1) then raise exception 'controls_expired_session_allowed'; end if; end $test$;
reset role;
delete from auth.sessions where id='70000000-0000-4000-8000-000000000071';
set local role authenticated;
do $test$ begin if public.orbe_pause_connection('10000000-0000-4000-8000-000000000071',1) or public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',1) then raise exception 'controls_signedout_session_allowed'; end if; end $test$;
reset role;
insert into auth.sessions(id,user_id,created_at) values('70000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000071',clock_timestamp()-interval '10 seconds');
set local role service_role;
do $test$
declare v_grant jsonb;
begin
  v_grant := public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000071',1);
  if v_grant->>'status'<>'acquired' then raise exception 'controls_lease_setup_failed'; end if;
  perform set_config('orbe.test_lease',v_grant->>'lease_id',true);
end $test$;
reset role;
set local role authenticated;
do $test$ begin
  if public.orbe_pause_connection('10000000-0000-4000-8000-000000000071',2) then raise exception 'controls_stale_pause_allowed'; end if;
  if not public.orbe_pause_connection('10000000-0000-4000-8000-000000000071',1) then raise exception 'controls_pause_denied'; end if;
  if not public.orbe_pause_connection('10000000-0000-4000-8000-000000000071',2) then raise exception 'controls_pause_not_idempotent'; end if;
  if public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',1) then raise exception 'controls_stale_remove_allowed'; end if;
  if not public.orbe_remove_connection('10000000-0000-4000-8000-000000000072',1) or not public.orbe_remove_connection('10000000-0000-4000-8000-000000000099',1) then raise exception 'controls_missing_foreign_leaks_state'; end if;
end $test$;
reset role;
do $test$ begin
  if not exists(select 1 from public.orbe_connections where id='10000000-0000-4000-8000-000000000071' and state='paused' and revision=2) or not exists(select 1 from public.orbe_connections where id='10000000-0000-4000-8000-000000000072') then raise exception 'controls_pause_revision_or_foreign_changed'; end if;
end $test$;
set local role service_role;
do $test$ begin
  if public.orbe_check_connection_read('10000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000071',1,current_setting('orbe.test_lease')::uuid,'accounts') then raise exception 'controls_pause_did_not_fence_lease'; end if;
end $test$;
reset role;
set local role authenticated;
do $test$ begin
  if not public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',2) or not public.orbe_remove_connection('10000000-0000-4000-8000-000000000071',2) then raise exception 'controls_remove_or_idempotence_denied'; end if;
end $test$;
reset role;
do $test$ begin
  if exists(select 1 from public.orbe_connections where id='10000000-0000-4000-8000-000000000071') or exists(select 1 from public.orbe_accounts where id='20000000-0000-4000-8000-000000000071')
    or exists(select 1 from orbe_private.connection_bindings where connection_id='10000000-0000-4000-8000-000000000071') or exists(select 1 from orbe_private.account_bindings where account_id='20000000-0000-4000-8000-000000000071')
    or exists(select 1 from orbe_private.connection_reads where connection_id='10000000-0000-4000-8000-000000000071') then raise exception 'controls_remove_cascade_failed'; end if;
end $test$;
rollback;
