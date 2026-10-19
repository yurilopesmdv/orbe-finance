begin;
do $test$
begin
  if exists(select 1 from auth.users where id in ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012')) then
    raise exception 'metadata_test_identity_collision';
  end if;
end $test$;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000011'),('00000000-0000-4000-8000-000000000012');
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
do $test$
begin
  if not public.orbe_is_owner() then raise exception 'metadata_owner_denied'; end if;
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
rollback;
