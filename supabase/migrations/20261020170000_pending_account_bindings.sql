begin;
create function public.orbe_stage_account_bindings(p_owner_id uuid,p_connection_id uuid,p_revision bigint,p_item_id uuid,p_accounts jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare conn public.orbe_connections; row_value jsonb; account_uuid uuid; external_id text; currency_value text;
begin
 if p_owner_id is null or p_connection_id is null or p_revision is null or p_revision<1 or p_item_id is null or jsonb_typeof(p_accounts) is distinct from 'array' then return false;end if;
 if jsonb_array_length(p_accounts)>1000 then return false;end if;
 perform 1 from orbe_private.app_owner where user_id=p_owner_id for update;
 if not found then return false;end if;
 select * into conn from public.orbe_connections where id=p_connection_id and owner_id=p_owner_id for update;
 if not found or conn.state<>'pending' or conn.revision<>p_revision then return false;end if;
 if not exists(select 1 from orbe_private.connection_bindings where connection_id=p_connection_id and owner_id=p_owner_id and external_item_id=p_item_id::text) then return false;end if;
 -- Validate every row before writing any row. Extra metadata (including values/PII) is forbidden.
 for row_value in select value from jsonb_array_elements(p_accounts) loop
  if jsonb_typeof(row_value) is distinct from 'object' then return false;end if;
  if (select count(*) from jsonb_object_keys(row_value))<>3 or not row_value ?& array['externalId','kind','currency'] then return false;end if;
  if jsonb_typeof(row_value->'externalId') is distinct from 'string' or (row_value->>'externalId') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or row_value->>'kind' is distinct from 'unknown' then return false;end if;
  if row_value->'currency'<>'null'::jsonb and (jsonb_typeof(row_value->'currency') is distinct from 'string' or (row_value->>'currency') !~ '^[A-Z]{3}$') then return false;end if;
  external_id:=row_value->>'externalId'; currency_value:=row_value->>'currency';
  if exists(select 1 from orbe_private.account_bindings where external_account_id=external_id and (connection_id<>p_connection_id or owner_id<>p_owner_id)) then return false;end if;
  if exists(select 1 from orbe_private.account_bindings b join public.orbe_accounts a on a.id=b.account_id where b.connection_id=p_connection_id and b.external_account_id=external_id and (a.kind<>'unknown' or a.currency is distinct from currency_value)) then return false;end if;
 end loop;
 if (select count(*) from jsonb_array_elements(p_accounts))<>(select count(distinct value->>'externalId') from jsonb_array_elements(p_accounts)) then return false;end if;
 if (select count(*) from public.orbe_accounts where connection_id=p_connection_id)+(select count(*) from jsonb_array_elements(p_accounts) v where not exists(select 1 from orbe_private.account_bindings b where b.connection_id=p_connection_id and b.external_account_id=v.value->>'externalId'))>1000 then return false;end if;
 for row_value in select value from jsonb_array_elements(p_accounts) loop
  external_id:=row_value->>'externalId';currency_value:=row_value->>'currency';
  if not exists(select 1 from orbe_private.account_bindings where connection_id=p_connection_id and external_account_id=external_id) then
   insert into public.orbe_accounts(connection_id,owner_id,kind,currency) values(p_connection_id,p_owner_id,'unknown',currency_value) returning id into account_uuid;
   insert into orbe_private.account_bindings(account_id,connection_id,owner_id,external_account_id) values(account_uuid,p_connection_id,p_owner_id,external_id);
  end if;
 end loop;
 return true;
end $$;
revoke all on function public.orbe_stage_account_bindings(uuid,uuid,bigint,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.orbe_stage_account_bindings(uuid,uuid,bigint,uuid,jsonb) to service_role;
comment on function public.orbe_stage_account_bindings(uuid,uuid,bigint,uuid,jsonb) is 'Atomic pending metadata inventory only. No financial values, OF proof, activation, deletion, rebinding or revision change.';
commit;
