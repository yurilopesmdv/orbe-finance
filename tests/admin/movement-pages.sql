begin;
set local statement_timeout='15s';
set local lock_timeout='2s';
set local plpgsql.check_asserts=on;
do $$ begin
 assert not exists(select 1 from auth.users where id in ('00000000-0000-4000-8000-000000000131','00000000-0000-4000-8000-000000000132')),'movement_test_user_collision';
 assert not exists(select 1 from auth.sessions where id in ('70000000-0000-4000-8000-000000000131','70000000-0000-4000-8000-000000000132','70000000-0000-4000-8000-000000000133')),'movement_test_session_collision';
 assert not exists(select 1 from public.orbe_connections where id='10000000-0000-4000-8000-000000000131'),'movement_test_connection_collision';
end $$;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000131'),('00000000-0000-4000-8000-000000000132');
insert into auth.sessions(id,user_id,created_at) values
 ('70000000-0000-4000-8000-000000000131','00000000-0000-4000-8000-000000000131',clock_timestamp()),
 ('70000000-0000-4000-8000-000000000132','00000000-0000-4000-8000-000000000131',clock_timestamp()),
 ('70000000-0000-4000-8000-000000000133','00000000-0000-4000-8000-000000000132',clock_timestamp());
insert into orbe_private.app_owner(singleton,user_id) values(true,'00000000-0000-4000-8000-000000000131') on conflict(singleton) do update set user_id=excluded.user_id;
insert into public.orbe_connections(id,owner_id,institution,state,accounts_available,transactions_available,open_finance_verified_at,proxy_consent_expires_at,bank_consent_expires_at)
 values('10000000-0000-4000-8000-000000000131','00000000-0000-4000-8000-000000000131','bradesco','active',true,true,clock_timestamp()-interval '1 day',clock_timestamp()+interval '1 day',clock_timestamp()+interval '1 day');
insert into orbe_private.connection_bindings(connection_id,owner_id,external_item_id) values('10000000-0000-4000-8000-000000000131','00000000-0000-4000-8000-000000000131','20000000-0000-4000-8000-000000000131');
insert into public.orbe_accounts(id,connection_id,owner_id) values('30000000-0000-4000-8000-000000000131','10000000-0000-4000-8000-000000000131','00000000-0000-4000-8000-000000000131');
insert into orbe_private.account_bindings(account_id,connection_id,owner_id,external_account_id) values('30000000-0000-4000-8000-000000000131','10000000-0000-4000-8000-000000000131','00000000-0000-4000-8000-000000000131','40000000-0000-4000-8000-000000000131');
select set_config('orbe.test_movement_owner','00000000-0000-4000-8000-000000000131',true);
select set_config('orbe.test_movement_connection','10000000-0000-4000-8000-000000000131',true);
select set_config('orbe.test_movement_session','70000000-0000-4000-8000-000000000131',true);
select set_config('orbe.test_movement_revision','1',true);
select set_config('orbe.test_movement_root',encode(sha256(convert_to('orbe:movements:cursor:root:v1','UTF8')),'hex'),true);
do $$ declare role_name text; begin
 foreach role_name in array array['anon','authenticated','service_role'] loop
  assert not has_table_privilege(role_name,'orbe_private.movement_page_reads','select,insert,update,delete'),'movement_table_grant';
  assert not has_function_privilege(role_name,'orbe_private.movement_session_hash(uuid,uuid)','execute'),'movement_session_helper_grant';
 end loop;
 assert not has_function_privilege('authenticated','public.orbe_finish_movement_read(uuid,uuid,bigint,uuid,uuid)','execute'),'movement_finalize_client_grant';
 assert not has_function_privilege('anon','public.orbe_finish_movement_read(uuid,uuid,bigint,uuid,uuid)','execute'),'movement_finalize_anon_grant';
 assert has_function_privilege('service_role','public.orbe_finish_movement_read(uuid,uuid,bigint,uuid,uuid)','execute'),'movement_finalize_service_denied';
 assert not has_function_privilege('anon','public.orbe_resolve_movement_read(uuid,uuid,bigint,uuid,uuid)','execute'),'movement_resolver_anon_grant';
 assert not has_function_privilege('authenticated','public.orbe_resolve_movement_read(uuid,uuid,bigint,uuid,uuid)','execute'),'movement_resolver_client_grant';
 assert has_function_privilege('service_role','public.orbe_resolve_movement_read(uuid,uuid,bigint,uuid,uuid)','execute'),'movement_resolver_service_denied';
 assert not has_function_privilege('anon','public.orbe_claim_movement_page(uuid,uuid,bigint,uuid,uuid,text,text)','execute'),'movement_anon_claim_grant';
 assert not has_function_privilege('authenticated','public.orbe_commit_movement_page(uuid,uuid,bigint,uuid,uuid,text,text,uuid,text,integer)','execute'),'movement_client_commit_grant';
 assert has_function_privilege('service_role','public.orbe_claim_movement_page(uuid,uuid,bigint,uuid,uuid,text,text)','execute'),'movement_service_claim_denied';
 assert has_function_privilege('service_role','public.orbe_commit_movement_page(uuid,uuid,bigint,uuid,uuid,text,text,uuid,text,integer)','execute'),'movement_service_commit_denied';
end $$;
set local role authenticated;
do $$ begin
 begin perform public.orbe_claim_movement_page(null,null,null,null,null,null,null);assert false,'movement_client_claim_allowed';exception when insufficient_privilege then null;end;
 begin perform public.orbe_commit_movement_page(null,null,null,null,null,null,null,null,null,null);assert false,'movement_client_commit_allowed';exception when insufficient_privilege then null;end;
end $$;
set local role service_role;
do $$ declare o uuid:=current_setting('orbe.test_movement_owner')::uuid;c uuid:=current_setting('orbe.test_movement_connection')::uuid;s uuid:=current_setting('orbe.test_movement_session')::uuid;r bigint:=1;l uuid;g jsonb;v jsonb;n uuid;h text:=current_setting('orbe.test_movement_root');a text:=repeat('a',64);begin
 begin perform count(*) from orbe_private.movement_page_reads;assert false,'movement_service_table_allowed';exception when insufficient_privilege then null;end;
 g:=public.orbe_begin_connection_read(c,o,r);assert g->>'status'='acquired','movement_lease_missing';l:=(g->>'lease_id')::uuid;perform set_config('orbe.test_movement_lease',l::text,true);
 v:=public.orbe_resolve_movement_read(c,o,r,l,s);
 assert v is not null and v->>'sessionId'=s::text and v->>'leaseId'=l::text and (v->>'leaseExpiresAt')::timestamptz=(g->>'lease_expires_at')::timestamptz,'movement_resolver_context';
 assert jsonb_array_length(v#>'{projection,bindings}')=1 and v#>'{projection,bindings,0,balanceAsOf}'='null'::jsonb and v#>>'{projection,bindings,0,relation}'='unknown' and v#>'{projection,coverageApproved}'='false'::jsonb,'movement_resolver_minimum';
 assert public.orbe_resolve_movement_read(c,o,r+1,l,s) is null,'movement_resolver_revision';
 assert public.orbe_resolve_movement_read(c,o,r,gen_random_uuid(),s) is null,'movement_resolver_lease';
 assert public.orbe_resolve_movement_read(c,'00000000-0000-4000-8000-000000000132',r,l,s) is null,'movement_resolver_owner';
 assert public.orbe_resolve_movement_read(c,o,r,l,'70000000-0000-4000-8000-000000000133') is null,'movement_resolver_session';
 assert public.orbe_resolve_movement_read(c,o,r,l,null) is null,'movement_resolver_null_session';
 assert not public.orbe_finish_movement_read(c,o,r,l,s),'movement_finalize_without_progress';
 assert public.orbe_claim_movement_page(c,o,r,l,s,'2026-10',repeat('b',64)) is null,'movement_nonroot_start';
 assert public.orbe_claim_movement_page(c,'00000000-0000-4000-8000-000000000132',r,l,s,'2026-10',h) is null,'movement_foreign_owner';
 assert public.orbe_claim_movement_page(c,o,r+1,l,s,'2026-10',h) is null,'movement_foreign_revision';
 assert public.orbe_claim_movement_page(c,o,r,l,'70000000-0000-4000-8000-000000000133','2026-10',h) is null,'movement_foreign_session_owner';
 assert public.orbe_claim_movement_page(c,o,r,l,s,'2026-13',h) is null,'movement_invalid_month';
 v:=public.orbe_claim_movement_page(c,o,r,l,s,'2026-10',h);assert v is not null and (v->>'pageNumber')::int=1,'movement_first_claim';n:=(v->>'claimId')::uuid;
 assert public.orbe_claim_movement_page(c,o,r,l,s,'2026-10',h) is null,'movement_duplicate_claim';
 assert not public.orbe_finish_movement_read(c,o,r,l,s),'movement_finalize_inflight';
 assert not public.orbe_finish_connection_read(c,o,r,l,'success'),'movement_generic_finalize_inflight';
 assert not public.orbe_commit_movement_page(c,o,r,l,s,'2026-10',h,gen_random_uuid(),a,500),'movement_wrong_nonce';
 assert not public.orbe_commit_movement_page(c,o,r,l,'70000000-0000-4000-8000-000000000132','2026-10',h,n,a,500),'movement_other_owner_session';
 assert not public.orbe_commit_movement_page(c,o,r,l,s,'2026-09',h,n,a,500),'movement_wrong_month';
 assert not public.orbe_commit_movement_page(c,o,r,l,s,'2026-10',h,n,h,500),'movement_cursor_cycle';
 assert not public.orbe_commit_movement_page(c,o,r,l,s,'2026-10',h,n,a,501),'movement_row_page_overflow';
 assert public.orbe_commit_movement_page(c,o,r,l,s,'2026-10',h,n,a,500),'movement_first_commit';
 assert not public.orbe_commit_movement_page(c,o,r,l,s,'2026-10',h,n,a,500),'movement_duplicate_commit';
 assert public.orbe_claim_movement_page(c,o,r,l,'70000000-0000-4000-8000-000000000132','2026-10',a) is null,'movement_changed_session';
 assert public.orbe_claim_movement_page(c,o,r,l,s,'2026-09',a) is null,'movement_changed_month';
 assert public.orbe_claim_movement_page(c,o,r,l,s,'2026-10',h) is null,'movement_old_cursor_replay';
 v:=public.orbe_claim_movement_page(c,o,r,l,s,'2026-10',a);assert (v->>'pageNumber')::int=2,'movement_second_claim';n:=(v->>'claimId')::uuid;
 assert public.orbe_commit_movement_page(c,o,r,l,s,'2026-10',a,n,null,7),'movement_final_commit';
 assert public.orbe_claim_movement_page(c,o,r,l,s,'2026-10',a) is null,'movement_finished_replay';
end $$;
reset role;
do $$ begin
 assert exists(select 1 from orbe_private.movement_page_reads where connection_id=current_setting('orbe.test_movement_connection')::uuid and page_count=2 and row_count=507 and finished and inflight_nonce is null),'movement_progress_counts';
end $$;
do $$ declare o uuid:=current_setting('orbe.test_movement_owner')::uuid;c uuid:=current_setting('orbe.test_movement_connection')::uuid;s uuid:=current_setting('orbe.test_movement_session')::uuid;l uuid:=current_setting('orbe.test_movement_lease')::uuid;r bigint;begin
 begin
  delete from orbe_private.account_bindings where connection_id=c;
  assert public.orbe_resolve_movement_read(c,o,1,l,s) is null,'movement_resolver_empty_bindings';
  raise exception using errcode='Z0001';
 exception when sqlstate 'Z0001' then null; end;
 begin
  delete from orbe_private.connection_bindings where connection_id=c;
  assert public.orbe_resolve_movement_read(c,o,1,l,s) is null,'movement_resolver_missing_item';
  raise exception using errcode='Z0001';
 exception when sqlstate 'Z0001' then null; end;
 begin
  insert into public.orbe_accounts(id,connection_id,owner_id) select md5('orbe-movement-fixture-'||i::text)::uuid,c,o from generate_series(1,100) i;
  insert into orbe_private.account_bindings(account_id,connection_id,owner_id,external_account_id) select md5('orbe-movement-fixture-'||i::text)::uuid,c,o,md5('external-fixture-'||i::text)::uuid::text from generate_series(1,100) i;
  assert public.orbe_resolve_movement_read(c,o,1,l,s) is null,'movement_resolver_binding_limit';
  delete from public.orbe_accounts where id=md5('orbe-movement-fixture-100')::uuid;
  assert jsonb_array_length(public.orbe_resolve_movement_read(c,o,1,l,s)#>'{projection,bindings}')=100,'movement_resolver_binding_boundary';
  raise exception using errcode='Z0001';
 exception when sqlstate 'Z0001' then null; end;
 begin
  update public.orbe_connections set transactions_available=false where id=c;
  select revision into r from public.orbe_connections where id=c;
  assert public.orbe_resolve_movement_read(c,o,r,l,s) is null,'movement_resolver_capability';
  raise exception using errcode='Z0001';
 exception when sqlstate 'Z0001' then null; end;
 update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id=s;
 assert public.orbe_resolve_movement_read(c,o,1,l,s) is null,'movement_resolver_expired_session';
 update auth.sessions set not_after=null where id=s;
end $$;
-- A new valid lease is the only supported reset. No retry clears an uncertain claim.
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '2 seconds',next_read_at=clock_timestamp()-interval '1 second' where connection_id=current_setting('orbe.test_movement_connection')::uuid;
set local role service_role;
do $$ declare o uuid:=current_setting('orbe.test_movement_owner')::uuid;c uuid:=current_setting('orbe.test_movement_connection')::uuid;s uuid:=current_setting('orbe.test_movement_session')::uuid;l uuid;g jsonb;v jsonb;n uuid;h text:=current_setting('orbe.test_movement_root');next_hash text;i int;begin
 g:=public.orbe_begin_connection_read(c,o,1);assert g->>'status'='acquired','movement_new_lease';l:=(g->>'lease_id')::uuid;perform set_config('orbe.test_movement_lease',l::text,true);
 for i in 1..100 loop
  v:=public.orbe_claim_movement_page(c,o,1,l,s,'2026-10',h);assert (v->>'pageNumber')::int=i,'movement_page_limit_claim';n:=(v->>'claimId')::uuid;
  next_hash:=encode(sha256(convert_to('movement-page-'||i::text,'UTF8')),'hex');
  if i=100 then
   assert not public.orbe_commit_movement_page(c,o,1,l,s,'2026-10',h,n,next_hash,0),'movement_page_limit_not_enforced';next_hash:=null;
  end if;
  assert public.orbe_commit_movement_page(c,o,1,l,s,'2026-10',h,n,next_hash,0),'movement_page_limit_commit';h:=next_hash;
 end loop;
 assert public.orbe_claim_movement_page(c,o,1,l,s,'2026-10',current_setting('orbe.test_movement_root')) is null,'movement_101st_page';
end $$;
reset role;
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '2 seconds',next_read_at=clock_timestamp()-interval '1 second' where connection_id=current_setting('orbe.test_movement_connection')::uuid;
set local role service_role;
do $$ declare o uuid:=current_setting('orbe.test_movement_owner')::uuid;c uuid:=current_setting('orbe.test_movement_connection')::uuid;s uuid:=current_setting('orbe.test_movement_session')::uuid;l uuid;g jsonb;v jsonb;n uuid;h text:=current_setting('orbe.test_movement_root');next_hash text;i int;begin
 g:=public.orbe_begin_connection_read(c,o,1);assert g->>'status'='acquired','movement_rows_lease';l:=(g->>'lease_id')::uuid;perform set_config('orbe.test_movement_lease',l::text,true);
 for i in 1..20 loop
  v:=public.orbe_claim_movement_page(c,o,1,l,s,'2026-10',h);assert v is not null,'movement_rows_claim';n:=(v->>'claimId')::uuid;
  next_hash:=encode(sha256(convert_to('movement-rows-'||i::text,'UTF8')),'hex');
  if i=20 then
   assert not public.orbe_commit_movement_page(c,o,1,l,s,'2026-10',h,n,next_hash,500),'movement_row_limit_not_enforced';next_hash:=null;
  end if;
  assert public.orbe_commit_movement_page(c,o,1,l,s,'2026-10',h,n,next_hash,500),'movement_rows_commit';h:=next_hash;
 end loop;
end $$;
reset role;
do $$ begin
 assert exists(select 1 from orbe_private.movement_page_reads where connection_id=current_setting('orbe.test_movement_connection')::uuid and row_count=10000 and page_count=20 and finished),'movement_row_limit_total';
end $$;
do $$ declare o uuid:=current_setting('orbe.test_movement_owner')::uuid;c uuid:=current_setting('orbe.test_movement_connection')::uuid;s uuid:=current_setting('orbe.test_movement_session')::uuid;l uuid:=current_setting('orbe.test_movement_lease')::uuid;begin
 begin
  assert not public.orbe_finish_movement_read(c,o,1,l,'70000000-0000-4000-8000-000000000132'),'movement_finalize_wrong_session';
  update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id=s;
  assert not public.orbe_finish_movement_read(c,o,1,l,s),'movement_finalize_expired_session';
  update auth.sessions set not_after=null where id=s;
  assert public.orbe_finish_movement_read(c,o,1,l,s),'movement_finalize_complete';
  assert not public.orbe_finish_movement_read(c,o,1,l,s),'movement_finalize_replay';
  assert exists(select 1 from orbe_private.connection_reads where connection_id=c and outcome='success' and completed_at is not null),'movement_finalize_outcome';
  raise exception using errcode='Z0001';
 exception when sqlstate 'Z0001' then null;end;
end $$;
-- Capability changes fence revision. An accounts lease cannot authorize movements.
update public.orbe_connections set transactions_available=false where id=current_setting('orbe.test_movement_connection')::uuid;
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '2 seconds',next_read_at=clock_timestamp()-interval '1 second' where connection_id=current_setting('orbe.test_movement_connection')::uuid;
select set_config('orbe.test_movement_revision',revision::text,true) from public.orbe_connections where id=current_setting('orbe.test_movement_connection')::uuid;
set local role service_role;
do $$ declare o uuid:=current_setting('orbe.test_movement_owner')::uuid;c uuid:=current_setting('orbe.test_movement_connection')::uuid;s uuid:=current_setting('orbe.test_movement_session')::uuid;r bigint:=current_setting('orbe.test_movement_revision')::bigint;g jsonb;begin
 g:=public.orbe_begin_connection_read(c,o,r);assert g->>'status'='acquired','movement_capability_lease';
 assert public.orbe_claim_movement_page(c,o,r,(g->>'lease_id')::uuid,s,'2026-10',current_setting('orbe.test_movement_root')) is null,'movement_capability_bypass';
end $$;
reset role;
update public.orbe_connections set transactions_available=true where id=current_setting('orbe.test_movement_connection')::uuid;
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '2 seconds',next_read_at=clock_timestamp()-interval '1 second' where connection_id=current_setting('orbe.test_movement_connection')::uuid;
select set_config('orbe.test_movement_revision',revision::text,true) from public.orbe_connections where id=current_setting('orbe.test_movement_connection')::uuid;
set local role service_role;
do $$ declare o uuid:=current_setting('orbe.test_movement_owner')::uuid;c uuid:=current_setting('orbe.test_movement_connection')::uuid;s uuid:=current_setting('orbe.test_movement_session')::uuid;r bigint:=current_setting('orbe.test_movement_revision')::bigint;l uuid;g jsonb;v jsonb;begin
 g:=public.orbe_begin_connection_read(c,o,r);l:=(g->>'lease_id')::uuid;perform set_config('orbe.test_movement_lease',l::text,true);
 v:=public.orbe_claim_movement_page(c,o,r,l,s,'2026-10',current_setting('orbe.test_movement_root'));assert v is not null,'movement_expiry_claim';perform set_config('orbe.test_movement_claim',v->>'claimId',true);
end $$;
reset role;
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '1 second' where connection_id=current_setting('orbe.test_movement_connection')::uuid;
set local role service_role;
do $$ begin
 assert not public.orbe_commit_movement_page(current_setting('orbe.test_movement_connection')::uuid,current_setting('orbe.test_movement_owner')::uuid,current_setting('orbe.test_movement_revision')::bigint,current_setting('orbe.test_movement_lease')::uuid,current_setting('orbe.test_movement_session')::uuid,'2026-10',current_setting('orbe.test_movement_root'),current_setting('orbe.test_movement_claim')::uuid,null,0),'movement_expired_commit';
end $$;
reset role;
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '2 seconds',next_read_at=clock_timestamp()-interval '1 second' where connection_id=current_setting('orbe.test_movement_connection')::uuid;
set local role service_role;
do $$ declare g jsonb;v jsonb;l uuid;begin
 g:=public.orbe_begin_connection_read(current_setting('orbe.test_movement_connection')::uuid,current_setting('orbe.test_movement_owner')::uuid,current_setting('orbe.test_movement_revision')::bigint);l:=(g->>'lease_id')::uuid;perform set_config('orbe.test_movement_lease',l::text,true);
 v:=public.orbe_claim_movement_page(current_setting('orbe.test_movement_connection')::uuid,current_setting('orbe.test_movement_owner')::uuid,current_setting('orbe.test_movement_revision')::bigint,l,current_setting('orbe.test_movement_session')::uuid,'2026-10',current_setting('orbe.test_movement_root'));assert v is not null,'movement_logout_claim';perform set_config('orbe.test_movement_claim',v->>'claimId',true);
end $$;
reset role;
delete from auth.sessions where id=current_setting('orbe.test_movement_session')::uuid;
set local role service_role;
do $$ begin
 assert not public.orbe_commit_movement_page(current_setting('orbe.test_movement_connection')::uuid,current_setting('orbe.test_movement_owner')::uuid,current_setting('orbe.test_movement_revision')::bigint,current_setting('orbe.test_movement_lease')::uuid,current_setting('orbe.test_movement_session')::uuid,'2026-10',current_setting('orbe.test_movement_root'),current_setting('orbe.test_movement_claim')::uuid,null,0),'movement_logout_commit';
end $$;
reset role;
rollback;
