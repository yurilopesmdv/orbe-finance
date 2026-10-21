begin;
set local statement_timeout='15s';
set local lock_timeout='2s';
set local plpgsql.check_asserts=on;
do $$ begin
 assert not exists(select 1 from auth.users where id in ('00000000-0000-4000-8000-000000000151','00000000-0000-4000-8000-000000000152')),'position_test_user_collision';
 assert not exists(select 1 from auth.sessions where id in ('70000000-0000-4000-8000-000000000151','70000000-0000-4000-8000-000000000152')),'position_test_session_collision';
 assert not exists(select 1 from public.orbe_connections where id='10000000-0000-4000-8000-000000000151'),'position_test_connection_collision';
end $$;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000151'),('00000000-0000-4000-8000-000000000152');
insert into auth.sessions(id,user_id,created_at) values('70000000-0000-4000-8000-000000000151','00000000-0000-4000-8000-000000000151',clock_timestamp()),('70000000-0000-4000-8000-000000000152','00000000-0000-4000-8000-000000000152',clock_timestamp());
insert into orbe_private.app_owner(singleton,user_id) values(true,'00000000-0000-4000-8000-000000000151') on conflict(singleton) do update set user_id=excluded.user_id;
insert into public.orbe_connections(id,owner_id,institution,state,investments_available,open_finance_verified_at,proxy_consent_expires_at,bank_consent_expires_at) values('10000000-0000-4000-8000-000000000151','00000000-0000-4000-8000-000000000151','bradesco','active',true,clock_timestamp()-interval '1 day',clock_timestamp()+interval '1 day',clock_timestamp()+interval '1 day');
insert into orbe_private.connection_bindings(connection_id,owner_id,external_item_id) values('10000000-0000-4000-8000-000000000151','00000000-0000-4000-8000-000000000151','20000000-0000-4000-8000-000000000151');
select set_config('orbe.position_owner','00000000-0000-4000-8000-000000000151',true),set_config('orbe.position_conn','10000000-0000-4000-8000-000000000151',true),set_config('orbe.position_item','20000000-0000-4000-8000-000000000151',true),set_config('orbe.position_session','70000000-0000-4000-8000-000000000151',true);
do $$ begin
 assert not has_table_privilege('anon','public.orbe_positions','select'),'position_anon_select';
 assert not has_table_privilege('authenticated','public.orbe_positions','insert,update,delete'),'position_client_write';
 assert not has_table_privilege('authenticated','orbe_private.position_bindings','select,insert,update,delete'),'position_private_client_grant';
 assert not has_function_privilege('authenticated','public.orbe_stage_position_bindings(uuid,uuid,bigint,uuid,uuid,uuid,jsonb)','execute'),'position_stage_client_grant';
 assert not has_function_privilege('anon','public.orbe_resolve_investment_read(uuid,uuid,bigint,uuid,uuid)','execute'),'position_resolver_anon_grant';
 assert has_function_privilege('service_role','public.orbe_stage_position_bindings(uuid,uuid,bigint,uuid,uuid,uuid,jsonb)','execute'),'position_stage_service_denied';
 assert has_function_privilege('service_role','public.orbe_resolve_investment_read(uuid,uuid,bigint,uuid,uuid)','execute'),'position_resolver_service_denied';
end $$;
set local role service_role;
do $$ declare o uuid:=current_setting('orbe.position_owner')::uuid;c uuid:=current_setting('orbe.position_conn')::uuid;i uuid:=current_setting('orbe.position_item')::uuid;s uuid:=current_setting('orbe.position_session')::uuid;g jsonb;l uuid;v jsonb;ids jsonb:='[{"externalId":"40000000-0000-4000-8000-000000000151"}]';prior uuid;begin
 g:=public.orbe_begin_connection_read(c,o,1);assert g->>'status'='acquired','position_lease_missing';l:=(g->>'lease_id')::uuid;perform set_config('orbe.position_lease',l::text,true);
 v:=public.orbe_resolve_investment_read(c,o,1,l,s);assert v is not null and jsonb_array_length(v#>'{projection,bindings}')=0,'position_empty_context';
 assert not public.orbe_stage_position_bindings(o,c,1,gen_random_uuid(),l,s,ids),'position_wrong_item';
 assert not public.orbe_stage_position_bindings('00000000-0000-4000-8000-000000000152',c,1,i,l,s,ids),'position_foreign_owner';
 assert not public.orbe_stage_position_bindings(o,c,2,i,l,s,ids),'position_wrong_revision';
 assert not public.orbe_stage_position_bindings(o,c,1,i,gen_random_uuid(),s,ids),'position_wrong_lease';
 assert not public.orbe_stage_position_bindings(o,c,1,i,l,'70000000-0000-4000-8000-000000000152',ids),'position_foreign_session';
 assert not public.orbe_stage_position_bindings(o,c,1,i,l,s,ids||ids),'position_duplicate_batch';
 assert not public.orbe_stage_position_bindings(o,c,1,i,l,s,'[{"externalId":"40000000-0000-4000-8000-000000000151","amount":1}]'),'position_values_rejected';
 assert not public.orbe_stage_position_bindings(o,c,1,i,l,s,'[{"externalId":"40000000-0000-4000-8000-000000000151"},{"externalId":"bad"}]'),'position_invalid_last_row';
 assert jsonb_array_length(public.orbe_resolve_investment_read(c,o,1,l,s)#>'{projection,bindings}')=0,'position_invalid_batch_partial_write';
 assert public.orbe_stage_position_bindings(o,c,1,i,l,s,ids),'position_stage_first';
 v:=public.orbe_resolve_investment_read(c,o,1,l,s);assert v->>'ownerId'=o::text and v->>'sessionId'=s::text and v->>'leaseId'=l::text and (v->>'leaseExpiresAt')::timestamptz=(g->>'lease_expires_at')::timestamptz,'position_resolver_context';
 assert jsonb_array_length(v#>'{projection,bindings}')=1 and v#>>'{projection,bindings,0,externalId}'='40000000-0000-4000-8000-000000000151','position_binding_missing';prior:=(v#>>'{projection,bindings,0,internalId}')::uuid;
 assert public.orbe_stage_position_bindings(o,c,1,i,l,s,ids),'position_stage_repeat';
 assert (public.orbe_resolve_investment_read(c,o,1,l,s)#>>'{projection,bindings,0,internalId}')::uuid=prior,'position_identity_changed';
 assert public.orbe_resolve_investment_read(c,o,2,l,s) is null,'position_resolver_revision';
 assert public.orbe_resolve_investment_read(c,o,1,l,'70000000-0000-4000-8000-000000000152') is null,'position_resolver_session';
end $$;
reset role;
do $$ begin
 assert (select count(*) from public.orbe_positions where connection_id=current_setting('orbe.position_conn')::uuid)=1,'position_atomic_count';
 assert exists(select 1 from public.orbe_connections where id=current_setting('orbe.position_conn')::uuid and revision=1 and investments_available and reserves_available is null),'position_connection_mutated';
 assert not exists(select 1 from information_schema.columns where table_schema='public' and table_name='orbe_positions' and column_name in ('amount','balance','gross_cents','net_cents','name','code','owner_name','external_id')),'position_sensitive_column';
end $$;
-- Exercise accumulated bounds inside a subtransaction that preserves the single seed.
set local role service_role;
do $$ declare o uuid:=current_setting('orbe.position_owner')::uuid;c uuid:=current_setting('orbe.position_conn')::uuid;i uuid:=current_setting('orbe.position_item')::uuid;s uuid:=current_setting('orbe.position_session')::uuid;l uuid:=current_setting('orbe.position_lease')::uuid;v jsonb;begin
 begin
  select jsonb_agg(jsonb_build_object('externalId','50000000-0000-4000-8000-'||lpad(n::text,12,'0'))) into v from generate_series(1,1001) n;
  assert not public.orbe_stage_position_bindings(o,c,1,i,l,s,v),'position_batch_overflow';
  select jsonb_agg(jsonb_build_object('externalId','50000000-0000-4000-8000-'||lpad(n::text,12,'0'))) into v from generate_series(1,1000) n;
  assert not public.orbe_stage_position_bindings(o,c,1,i,l,s,v),'position_total_overflow';
  select jsonb_agg(jsonb_build_object('externalId','50000000-0000-4000-8000-'||lpad(n::text,12,'0'))) into v from generate_series(1,999) n;
  assert public.orbe_stage_position_bindings(o,c,1,i,l,s,v),'position_total_boundary';
  assert jsonb_array_length(public.orbe_resolve_investment_read(c,o,1,l,s)#>'{projection,bindings}')=1000,'position_total_count';
  assert not public.orbe_stage_position_bindings(o,c,1,i,l,s,'[{"externalId":"60000000-0000-4000-8000-000000000151"}]'),'position_new_over_total';
  raise exception using errcode='Z0001';
 exception when sqlstate 'Z0001' then null;end;
 begin insert into public.orbe_positions(connection_id,owner_id,product) values(c,o,'reserve');assert false,'position_reserve_inferred';exception when check_violation then null;end;
 begin insert into public.orbe_positions(connection_id,owner_id) values(c,'00000000-0000-4000-8000-000000000152');assert false,'position_foreign_binding_allowed';exception when foreign_key_violation then null;end;
end $$;
reset role;
-- RLS uses real password-session metadata, not owner UUID alone.
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('orbe.position_owner'),'role','authenticated','is_anonymous',false,'session_id',current_setting('orbe.position_session'),'exp',floor(extract(epoch from clock_timestamp()))::bigint+600,'amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from clock_timestamp()))::bigint)))::text,true);
set local role authenticated;
do $$ begin
 assert (select count(*) from public.orbe_positions)=1,'position_owner_rls_denied';
 begin perform public.orbe_stage_position_bindings(null,null,null,null,null,null,null);assert false,'position_client_stage_allowed';exception when insufficient_privilege then null;end;
 begin insert into public.orbe_positions(connection_id,owner_id) values(current_setting('orbe.position_conn')::uuid,current_setting('orbe.position_owner')::uuid);assert false,'position_client_insert_allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000152','role','authenticated','is_anonymous',false,'session_id','70000000-0000-4000-8000-000000000152','exp',floor(extract(epoch from clock_timestamp()))::bigint+600,'amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from clock_timestamp()))::bigint)))::text,true);
set local role authenticated;
do $$ begin assert (select count(*) from public.orbe_positions)=0,'position_foreign_rls_leak';end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('orbe.position_owner'),'role','authenticated','is_anonymous',false,'session_id',current_setting('orbe.position_session'),'exp',floor(extract(epoch from clock_timestamp()))::bigint+600,'amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from clock_timestamp()))::bigint)))::text,true);
update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id=current_setting('orbe.position_session')::uuid;
set local role authenticated;
do $$ begin assert (select count(*) from public.orbe_positions)=0,'position_expired_owner_rls_leak';end $$;
reset role;
set local role service_role;
do $$ begin
 assert public.orbe_resolve_investment_read(current_setting('orbe.position_conn')::uuid,current_setting('orbe.position_owner')::uuid,1,current_setting('orbe.position_lease')::uuid,current_setting('orbe.position_session')::uuid) is null,'position_expired_session_resolve';
 assert not public.orbe_stage_position_bindings(current_setting('orbe.position_owner')::uuid,current_setting('orbe.position_conn')::uuid,1,current_setting('orbe.position_item')::uuid,current_setting('orbe.position_lease')::uuid,current_setting('orbe.position_session')::uuid,'[]'),'position_expired_session_stage';
end $$;
reset role;
update auth.sessions set not_after=null where id=current_setting('orbe.position_session')::uuid;
-- Capability changes fence revision and cannot be repaired by staging.
update public.orbe_connections set investments_available=false,accounts_available=true where id=current_setting('orbe.position_conn')::uuid;
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '2 seconds',next_read_at=clock_timestamp()-interval '1 second' where connection_id=current_setting('orbe.position_conn')::uuid;
set local role service_role;
do $$ declare g jsonb;begin
 g:=public.orbe_begin_connection_read(current_setting('orbe.position_conn')::uuid,current_setting('orbe.position_owner')::uuid,2);assert g->>'status'='acquired','position_disabled_new_lease';
 assert public.orbe_resolve_investment_read(current_setting('orbe.position_conn')::uuid,current_setting('orbe.position_owner')::uuid,2,(g->>'lease_id')::uuid,current_setting('orbe.position_session')::uuid) is null,'position_capability_current_revision';
 assert not public.orbe_stage_position_bindings(current_setting('orbe.position_owner')::uuid,current_setting('orbe.position_conn')::uuid,2,current_setting('orbe.position_item')::uuid,(g->>'lease_id')::uuid,current_setting('orbe.position_session')::uuid,'[]'),'position_stage_capability_bypass';
 assert public.orbe_resolve_investment_read(current_setting('orbe.position_conn')::uuid,current_setting('orbe.position_owner')::uuid,1,current_setting('orbe.position_lease')::uuid,current_setting('orbe.position_session')::uuid) is null,'position_disabled_capability';end $$;
reset role;
rollback;
