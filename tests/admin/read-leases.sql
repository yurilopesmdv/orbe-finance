begin;
set local statement_timeout='10s';
set local lock_timeout='2s';
do $test$
begin
  if exists(select 1 from auth.users where id in ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000032')) then raise exception 'lease_test_identity_collision'; end if;
end $test$;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000031'),('00000000-0000-4000-8000-000000000032');
insert into orbe_private.app_owner(singleton,user_id) values(true,'00000000-0000-4000-8000-000000000031') on conflict(singleton) do update set user_id=excluded.user_id;
insert into public.orbe_connections(id,owner_id,institution,state,accounts_available,transactions_available,investments_available,open_finance_verified_at,proxy_consent_expires_at) values
('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031','bradesco','active',true,null,false,clock_timestamp()-interval '1 day',clock_timestamp()+interval '1 day'),
('10000000-0000-4000-8000-000000000032','00000000-0000-4000-8000-000000000032','mercado-pago','active',true,null,null,clock_timestamp()-interval '1 day',null),
('10000000-0000-4000-8000-000000000033','00000000-0000-4000-8000-000000000031','inter','active',false,null,false,clock_timestamp()-interval '1 day',null),
('10000000-0000-4000-8000-000000000034','00000000-0000-4000-8000-000000000031','nubank','pending',true,null,null,null,null);

insert into public.orbe_connections(id,owner_id,institution,state,accounts_available,open_finance_verified_at,proxy_consent_expires_at,bank_consent_expires_at) values
('10000000-0000-4000-8000-000000000035','00000000-0000-4000-8000-000000000031','bradesco','active',true,clock_timestamp()-interval '1 day',null,clock_timestamp()+interval '1 day'),
('10000000-0000-4000-8000-000000000036','00000000-0000-4000-8000-000000000031','bradesco','active',true,clock_timestamp()-interval '1 day',clock_timestamp()+interval '1 day',clock_timestamp()-interval '1 second'),
('10000000-0000-4000-8000-000000000037','00000000-0000-4000-8000-000000000031','bradesco','active',true,clock_timestamp()-interval '1 day',clock_timestamp()-interval '1 second',clock_timestamp()+interval '1 day');

do $test$
begin
  if has_table_privilege('service_role','orbe_private.connection_reads','SELECT') or has_table_privilege('service_role','orbe_private.connection_reads','INSERT') then raise exception 'lease_table_service_direct_access'; end if;
  if not has_function_privilege('service_role','public.orbe_begin_connection_read(uuid,uuid,bigint)','EXECUTE') then raise exception 'lease_service_execute_missing'; end if;
  if has_function_privilege('authenticated','public.orbe_begin_connection_read(uuid,uuid,bigint)','EXECUTE') or has_function_privilege('anon','public.orbe_begin_connection_read(uuid,uuid,bigint)','EXECUTE') then raise exception 'lease_client_execute_granted'; end if;
end $test$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000031',true);
do $test$
begin
  begin perform public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1); raise exception 'lease_client_acquire_allowed'; exception when insufficient_privilege then null; end;
  begin perform public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,'00000000-0000-4000-8000-000000000099','accounts'); raise exception 'lease_client_check_allowed'; exception when insufficient_privilege then null; end;
  begin perform public.orbe_finish_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,'00000000-0000-4000-8000-000000000099','success'); raise exception 'lease_client_finish_allowed'; exception when insufficient_privilege then null; end;
  begin perform * from orbe_private.connection_reads; raise exception 'lease_client_table_visible'; exception when insufficient_privilege then null; end;
end $test$;
set local role anon;
do $test$
begin
  begin perform public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1); raise exception 'lease_anon_acquire_allowed'; exception when insufficient_privilege then null; end;
end $test$;
set local role service_role;
do $test$
declare granted jsonb; identifier uuid;
begin
  begin perform * from orbe_private.connection_reads; raise exception 'lease_service_table_visible'; exception when insufficient_privilege then null; end;
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000032','00000000-0000-4000-8000-000000000032',1)->>'status' <> 'unavailable' then raise exception 'lease_unregistered_owner_allowed'; end if;
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000032',1)->>'status' <> 'unavailable' then raise exception 'lease_foreign_owner_allowed'; end if;
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',0)->>'status' <> 'unavailable' then raise exception 'lease_wrong_revision_allowed'; end if;
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000033','00000000-0000-4000-8000-000000000031',1)->>'status' <> 'unavailable' then raise exception 'lease_no_known_product_allowed'; end if;
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000034','00000000-0000-4000-8000-000000000031',1)->>'status' <> 'unavailable' then raise exception 'lease_pending_allowed'; end if;
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000035','00000000-0000-4000-8000-000000000031',1)->>'status'<>'unavailable' then raise exception 'lease_unknown_proxy_expiry_allowed'; end if;
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000036','00000000-0000-4000-8000-000000000031',1)->>'status'<>'unavailable' then raise exception 'lease_expired_bank_allowed'; end if;
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000037','00000000-0000-4000-8000-000000000031',1)->>'status'<>'unavailable' then raise exception 'lease_active_expired_proxy_allowed'; end if;
  granted := public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1);
  if granted->>'status' <> 'acquired' or (granted->>'revision')::bigint <> 1 then raise exception 'lease_acquire_failed'; end if;
  if abs(extract(epoch from ((granted->>'lease_expires_at')::timestamptz-clock_timestamp()))-120)>1 or abs(extract(epoch from ((granted->>'next_read_at')::timestamptz-clock_timestamp()))-900)>1 then raise exception 'lease_timing_policy_failed'; end if;
  identifier := (granted->>'lease_id')::uuid;
  perform set_config('orbe.test_lease',identifier::text,true);
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1)->>'status' <> 'busy' then raise exception 'lease_second_acquire_not_busy'; end if;
  if not public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'accounts') then raise exception 'lease_pagination_denied'; end if;
  if not public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'accounts') then raise exception 'lease_second_page_denied_by_cooldown'; end if;
  if public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'transactions') or public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'investments') then raise exception 'lease_unknown_or_false_product_allowed'; end if;
  if public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'arbitrary') then raise exception 'lease_arbitrary_product_allowed'; end if;
  if public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,'00000000-0000-4000-8000-000000000099','accounts') then raise exception 'lease_wrong_nonce_allowed'; end if;
  if public.orbe_finish_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'private-error') then raise exception 'lease_unknown_outcome_allowed'; end if;
  if not public.orbe_finish_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'failed') then raise exception 'lease_finish_failed_denied'; end if;
  if public.orbe_finish_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'success') then raise exception 'lease_duplicate_finish_allowed'; end if;
  if public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'accounts') then raise exception 'lease_completed_read_allowed'; end if;
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1)->>'status' <> 'cooldown' then raise exception 'lease_failure_bypassed_cooldown'; end if;
  if (select last_read_at from public.orbe_connections where id='10000000-0000-4000-8000-000000000031') is not null then raise exception 'lease_failure_marked_success'; end if;
end $test$;
reset role;
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '2 seconds',next_read_at=clock_timestamp()-interval '1 second' where connection_id='10000000-0000-4000-8000-000000000031';
set local role service_role;
do $test$
declare granted jsonb; identifier uuid;
begin
  granted := public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1);
  if granted->>'status' <> 'acquired' then raise exception 'lease_after_cooldown_denied'; end if;
  identifier := (granted->>'lease_id')::uuid;
  if identifier=current_setting('orbe.test_lease')::uuid then raise exception 'lease_nonce_reused'; end if;
  if not public.orbe_finish_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'success') then raise exception 'lease_success_denied'; end if;
  if (select last_read_at from public.orbe_connections where id='10000000-0000-4000-8000-000000000031') is null or (select revision from public.orbe_connections where id='10000000-0000-4000-8000-000000000031')<>1 then raise exception 'lease_success_metadata_failed'; end if;
end $test$;
reset role;
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '2 seconds',next_read_at=clock_timestamp()-interval '1 second' where connection_id='10000000-0000-4000-8000-000000000031';
set local role service_role;
do $test$
declare granted jsonb;
begin
  granted := public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1);
  perform set_config('orbe.test_lease',(granted->>'lease_id'),true);
end $test$;
reset role;
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '1 second' where connection_id='10000000-0000-4000-8000-000000000031';
set local role service_role;
do $test$
begin
  if public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,current_setting('orbe.test_lease')::uuid,'accounts') then raise exception 'lease_expired_page_allowed'; end if;
  if public.orbe_finish_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,current_setting('orbe.test_lease')::uuid,'success') then raise exception 'lease_expired_finish_allowed'; end if;
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1)->>'status' <> 'cooldown' then raise exception 'lease_expiry_bypassed_cooldown'; end if;
end $test$;
reset role;
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '2 seconds',next_read_at=clock_timestamp()-interval '1 second' where connection_id='10000000-0000-4000-8000-000000000031';
set local role service_role;
do $test$
declare granted jsonb; identifier uuid;
begin
  granted := public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1);
  identifier := (granted->>'lease_id')::uuid;
  perform set_config('orbe.test_lease',identifier::text,true);
  update public.orbe_connections set state='paused' where id='10000000-0000-4000-8000-000000000031';
  if (select revision from public.orbe_connections where id='10000000-0000-4000-8000-000000000031')<>2 then raise exception 'lease_pause_revision_not_fenced'; end if;
  if public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'accounts') or public.orbe_finish_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',1,identifier,'success') then raise exception 'lease_paused_result_allowed'; end if;
  update public.orbe_connections set state='active' where id='10000000-0000-4000-8000-000000000031';
  if (select revision from public.orbe_connections where id='10000000-0000-4000-8000-000000000031')<>3 then raise exception 'lease_resume_revision_not_fenced'; end if;
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',3)->>'status'<>'cooldown' then raise exception 'lease_revision_bypassed_cooldown'; end if;
  update public.orbe_connections set transactions_available=false where id='10000000-0000-4000-8000-000000000031';
  if (select revision from public.orbe_connections where id='10000000-0000-4000-8000-000000000031')<>4 then raise exception 'lease_capability_revision_not_fenced'; end if;
  begin update public.orbe_connections set revision=1 where id='10000000-0000-4000-8000-000000000031'; raise exception 'lease_revision_downgrade_allowed'; exception when check_violation then null; end;
  update public.orbe_connections set source_updated_at=clock_timestamp() where id='10000000-0000-4000-8000-000000000031';
  if (select revision from public.orbe_connections where id='10000000-0000-4000-8000-000000000031')<>4 then raise exception 'lease_source_update_changed_authorization_revision'; end if;
  update public.orbe_connections set proxy_consent_expires_at=clock_timestamp()-interval '1 second' where id='10000000-0000-4000-8000-000000000031';
  if public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',5)->>'status'<>'unavailable' then raise exception 'lease_expired_authorization_allowed'; end if;
end $test$;
reset role;
update public.orbe_connections set proxy_consent_expires_at=clock_timestamp()+interval '1 day' where id='10000000-0000-4000-8000-000000000031';
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '2 seconds',next_read_at=clock_timestamp()-interval '1 second' where connection_id='10000000-0000-4000-8000-000000000031';
set local role service_role;
do $test$
declare granted jsonb;
begin
  granted := public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',6);
  if granted->>'status'<>'acquired' then raise exception 'lease_current_revision_acquire_failed'; end if;
  perform set_config('orbe.test_lease',granted->>'lease_id',true);
end $test$;
reset role;
update orbe_private.app_owner set user_id='00000000-0000-4000-8000-000000000032';
set local role service_role;
do $test$
begin
  if public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',6,current_setting('orbe.test_lease')::uuid,'accounts') then raise exception 'lease_unregistered_owner_continued'; end if;
end $test$;
reset role;
update orbe_private.app_owner set user_id='00000000-0000-4000-8000-000000000031';
set local role service_role;
do $test$
begin
  if not public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',6,current_setting('orbe.test_lease')::uuid,'accounts') then raise exception 'lease_owner_restore_failed'; end if;
  update public.orbe_connections set bank_consent_expires_at=clock_timestamp()+interval '1 day' where id='10000000-0000-4000-8000-000000000031';
  if (select revision from public.orbe_connections where id='10000000-0000-4000-8000-000000000031')<>7 then raise exception 'lease_bank_expiry_revision_not_fenced'; end if;
  if public.orbe_check_connection_read('10000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031',6,current_setting('orbe.test_lease')::uuid,'accounts') then raise exception 'lease_bank_expiry_change_retained_old_lease'; end if;
end $test$;
reset role;
delete from public.orbe_connections where id='10000000-0000-4000-8000-000000000031';
do $test$
begin
  if exists(select 1 from orbe_private.connection_reads where connection_id='10000000-0000-4000-8000-000000000031') then raise exception 'lease_delete_did_not_cascade'; end if;
end $test$;
rollback;
