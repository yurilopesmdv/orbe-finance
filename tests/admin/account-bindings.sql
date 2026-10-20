begin;
set local statement_timeout='10s';
set local lock_timeout='2s';
do $$ begin
  if exists(select 1 from auth.users where id in ('00000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000112')) then raise exception 'binding_test_identity_collision'; end if;
end $$;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000111'),('00000000-0000-4000-8000-000000000112');
insert into orbe_private.app_owner(singleton,user_id) values(true,'00000000-0000-4000-8000-000000000111') on conflict(singleton) do update set user_id=excluded.user_id;
insert into public.orbe_connections(id,owner_id,institution,state,accounts_available,open_finance_verified_at,proxy_consent_expires_at) values
 ('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111','bradesco','active',true,clock_timestamp()-interval '1 day',clock_timestamp()+interval '1 day');
insert into orbe_private.connection_bindings(connection_id,owner_id,external_item_id) values
 ('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111','20000000-0000-4000-8000-000000000111');
insert into public.orbe_accounts(id,connection_id,owner_id) values
 ('30000000-0000-4000-8000-000000000111','10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111');
insert into orbe_private.account_bindings(account_id,connection_id,owner_id,external_account_id) values
 ('30000000-0000-4000-8000-000000000111','10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111','40000000-0000-4000-8000-000000000111');
do $$ begin
 if has_function_privilege('anon','public.orbe_resolve_account_read(uuid,uuid,bigint,uuid)','execute') or has_function_privilege('authenticated','public.orbe_resolve_account_read(uuid,uuid,bigint,uuid)','execute') then raise exception 'binding_client_grant'; end if;
 if not has_function_privilege('service_role','public.orbe_resolve_account_read(uuid,uuid,bigint,uuid)','execute') then raise exception 'binding_service_denied'; end if;
end $$;
set local role authenticated;
do $$ begin
 begin perform public.orbe_resolve_account_read('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111',1,'50000000-0000-4000-8000-000000000111');raise exception 'binding_client_allowed';exception when insufficient_privilege then null;end;
end $$;
set local role service_role;
do $$ declare grant_value jsonb; lease uuid; value jsonb; begin
 grant_value:=public.orbe_begin_connection_read('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111',1);
 if grant_value->>'status'<>'acquired' then raise exception 'binding_lease_failed';end if;
 lease:=(grant_value->>'lease_id')::uuid;perform set_config('orbe.test_binding_lease',lease::text,true);
 value:=public.orbe_resolve_account_read('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111',1,lease);
 if value->>'ownerId'<>'00000000-0000-4000-8000-000000000111' or value#>>'{projection,itemId}'<>'20000000-0000-4000-8000-000000000111' or value#>>'{projection,bindings,0,internalId}'<>'30000000-0000-4000-8000-000000000111' then raise exception 'binding_projection_failed';end if;
 if value#>'{projection,bindings,0,balanceAsOf}'<>'null'::jsonb or value#>>'{projection,bindings,0,relation}'<>'unknown' or value#>'{projection,coverageApproved}'<>'false'::jsonb then raise exception 'binding_invented_evidence';end if;
 if public.orbe_resolve_account_read('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000112',1,lease) is not null then raise exception 'binding_foreign_owner';end if;
 if public.orbe_resolve_account_read('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111',2,lease) is not null then raise exception 'binding_foreign_revision';end if;
 if public.orbe_resolve_account_read('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111',1,'50000000-0000-4000-8000-000000000111') is not null then raise exception 'binding_wrong_lease';end if;
end $$;
reset role;
delete from orbe_private.connection_bindings where connection_id='10000000-0000-4000-8000-000000000111';
set local role service_role;
do $$ begin
 if public.orbe_resolve_account_read('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111',1,current_setting('orbe.test_binding_lease')::uuid) is not null then raise exception 'binding_missing_item';end if;
end $$;
reset role;
insert into orbe_private.connection_bindings(connection_id,owner_id,external_item_id) values ('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111','20000000-0000-4000-8000-000000000111');
update orbe_private.connection_reads set lease_expires_at=clock_timestamp()-interval '1 second' where connection_id='10000000-0000-4000-8000-000000000111';
set local role service_role;
do $$ begin
 if public.orbe_resolve_account_read('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111',1,current_setting('orbe.test_binding_lease')::uuid) is not null then raise exception 'binding_expired_lease';end if;
end $$;
reset role;
update public.orbe_connections set state='paused' where id='10000000-0000-4000-8000-000000000111';
set local role service_role;
do $$ begin
 if public.orbe_resolve_account_read('10000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000111',1,current_setting('orbe.test_binding_lease')::uuid) is not null then raise exception 'binding_paused';end if;
end $$;
reset role;
-- Pending staging: service-only, exact repeat, no auto-verification or reactivation.
do $$ begin
 if has_function_privilege('anon','public.orbe_stage_connection(uuid,text,uuid)','execute') or has_function_privilege('authenticated','public.orbe_stage_connection(uuid,text,uuid)','execute') then raise exception 'stage_client_grant';end if;
end $$;
set local role authenticated;
do $$ begin
 begin perform public.orbe_stage_connection('00000000-0000-4000-8000-000000000111','mercado-pago','60000000-0000-4000-8000-000000000111');raise exception 'stage_client_allowed';exception when insufficient_privilege then null;end;
end $$;
set local role service_role;
do $$ begin
 if public.orbe_stage_connection('00000000-0000-4000-8000-000000000112','mercado-pago','60000000-0000-4000-8000-000000000111') then raise exception 'stage_foreign_owner';end if;
 if public.orbe_stage_connection('00000000-0000-4000-8000-000000000111','inter','60000000-0000-4000-8000-000000000111') then raise exception 'stage_wrong_bank';end if;
 if public.orbe_stage_connection('00000000-0000-4000-8000-000000000111','mercado-pago',null) then raise exception 'stage_null';end if;
 if public.orbe_stage_connection('00000000-0000-4000-8000-000000000111','mercado-pago','00000000-0000-0000-0000-000000000000') then raise exception 'stage_nil';end if;
 if public.orbe_stage_connection('00000000-0000-4000-8000-000000000111','mercado-pago','20000000-0000-4000-8000-000000000111') then raise exception 'stage_item_reused';end if;
 if public.orbe_stage_connection('00000000-0000-4000-8000-000000000111','bradesco','20000000-0000-4000-8000-000000000111') then raise exception 'stage_reopened_paused';end if;
 if not public.orbe_stage_connection('00000000-0000-4000-8000-000000000111','mercado-pago','60000000-0000-4000-8000-000000000111') then raise exception 'stage_create_failed';end if;
 if not public.orbe_stage_connection('00000000-0000-4000-8000-000000000111','mercado-pago','60000000-0000-4000-8000-000000000111') then raise exception 'stage_repeat_failed';end if;
 if public.orbe_stage_connection('00000000-0000-4000-8000-000000000111','mercado-pago','60000000-0000-4000-8000-000000000112') then raise exception 'stage_replacement_allowed';end if;
end $$;
reset role;
do $$ begin
 if (select count(*) from public.orbe_connections where owner_id='00000000-0000-4000-8000-000000000111' and institution='mercado-pago' and state='pending' and revision=1 and open_finance_verified_at is null and proxy_consent_expires_at is null and bank_consent_expires_at is null and accounts_available is null and transactions_available is null and investments_available is null and reserves_available is null)<>1 then raise exception 'stage_invented_evidence';end if;
 if (select count(*) from orbe_private.connection_bindings where external_item_id='60000000-0000-4000-8000-000000000111')<>1 then raise exception 'stage_binding_count';end if;
 if exists(select 1 from public.orbe_accounts a join public.orbe_connections c on c.id=a.connection_id where c.owner_id='00000000-0000-4000-8000-000000000111' and c.institution='mercado-pago') then raise exception 'stage_created_accounts';end if;
end $$;
-- Atomic account inventory, using the pending MP connection created above.
do $$ begin
 if has_function_privilege('anon','public.orbe_stage_account_bindings(uuid,uuid,bigint,uuid,jsonb)','execute') or has_function_privilege('authenticated','public.orbe_stage_account_bindings(uuid,uuid,bigint,uuid,jsonb)','execute') then raise exception 'inventory_client_grant';end if;
 perform set_config('orbe.test_inventory_connection',(select id::text from public.orbe_connections where owner_id='00000000-0000-4000-8000-000000000111' and institution='mercado-pago'),true);
end $$;
set local role authenticated;
do $$ begin
 begin perform public.orbe_stage_account_bindings('00000000-0000-4000-8000-000000000111',current_setting('orbe.test_inventory_connection')::uuid,1,'60000000-0000-4000-8000-000000000111','[]');raise exception 'inventory_client_allowed';exception when insufficient_privilege then null;end;
end $$;
set local role service_role;
do $$ declare owner_uuid uuid:='00000000-0000-4000-8000-000000000111';connection_uuid uuid:=current_setting('orbe.test_inventory_connection')::uuid;item_uuid uuid:='60000000-0000-4000-8000-000000000111';rows_json jsonb:='[{"externalId":"70000000-0000-4000-8000-000000000111","kind":"unknown","currency":"BRL"},{"externalId":"70000000-0000-4000-8000-000000000112","kind":"unknown","currency":null}]';saved_id uuid;begin
 if public.orbe_stage_account_bindings('00000000-0000-4000-8000-000000000112',connection_uuid,1,item_uuid,rows_json) then raise exception 'inventory_foreign_owner';end if;
 if public.orbe_stage_account_bindings(owner_uuid,connection_uuid,2,item_uuid,rows_json) then raise exception 'inventory_wrong_revision';end if;
 if public.orbe_stage_account_bindings(owner_uuid,connection_uuid,1,'60000000-0000-4000-8000-000000000112',rows_json) then raise exception 'inventory_wrong_item';end if;
 if public.orbe_stage_account_bindings(owner_uuid,connection_uuid,1,item_uuid,rows_json||jsonb_build_array(rows_json->0)) then raise exception 'inventory_duplicate';end if;
 if public.orbe_stage_account_bindings(owner_uuid,connection_uuid,1,item_uuid,rows_json||'[{"externalId":"70000000-0000-4000-8000-000000000113","kind":"unknown","currency":"BRL","balance":1}]'::jsonb) then raise exception 'inventory_extra_field';end if;
 if exists(select 1 from public.orbe_accounts where connection_id=connection_uuid) then raise exception 'inventory_partial_write';end if;
 if not public.orbe_stage_account_bindings(owner_uuid,connection_uuid,1,item_uuid,rows_json) then raise exception 'inventory_create_failed';end if;
 select account_id into saved_id from orbe_private.account_bindings where connection_id=connection_uuid and external_account_id='70000000-0000-4000-8000-000000000111';
 if saved_id is null or saved_id='70000000-0000-4000-8000-000000000111'::uuid then raise exception 'inventory_internal_identity';end if;
 if not public.orbe_stage_account_bindings(owner_uuid,connection_uuid,1,item_uuid,rows_json) then raise exception 'inventory_repeat_failed';end if;
 if not exists(select 1 from orbe_private.account_bindings where connection_id=connection_uuid and account_id=saved_id) then raise exception 'inventory_identity_changed';end if;
 if public.orbe_stage_account_bindings(owner_uuid,connection_uuid,1,item_uuid,jsonb_set(rows_json,'{0,currency}','"USD"')) then raise exception 'inventory_currency_overwritten';end if;
 if not public.orbe_stage_account_bindings(owner_uuid,connection_uuid,1,item_uuid,'[]') or (select count(*) from public.orbe_accounts where connection_id=connection_uuid)<>2 then raise exception 'inventory_empty_deleted';end if;
end $$;
reset role;
update public.orbe_connections set state='paused' where id=current_setting('orbe.test_inventory_connection')::uuid;
set local role service_role;
do $$ begin
 if public.orbe_stage_account_bindings('00000000-0000-4000-8000-000000000111',current_setting('orbe.test_inventory_connection')::uuid,2,'60000000-0000-4000-8000-000000000111','[]') then raise exception 'inventory_paused_allowed';end if;
end $$;
reset role;
rollback;
