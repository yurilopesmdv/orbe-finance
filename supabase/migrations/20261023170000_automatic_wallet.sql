begin;
create or replace function public.orbe_stage_connection(p_owner_id uuid, p_institution text, p_item_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare existing public.orbe_connections; new_id uuid;
begin
  if p_owner_id is null or p_item_id is null or p_item_id='00000000-0000-0000-0000-000000000000'::uuid
     or p_institution is null or p_institution not in ('bradesco','mercado-pago','nubank') then return false; end if;
  -- Serialize staging for the registered owner; never replace that owner.
  perform 1 from orbe_private.app_owner where user_id=p_owner_id for update;
  if not found then return false; end if;
  if exists(select 1 from orbe_private.connection_bindings b join public.orbe_connections c on c.id=b.connection_id
    where b.external_item_id=p_item_id::text and (b.owner_id<>p_owner_id or c.institution<>p_institution)) then return false; end if;
  if (select count(*) from public.orbe_connections where owner_id=p_owner_id and institution=p_institution)>1 then return false; end if;
  select * into existing from public.orbe_connections where owner_id=p_owner_id and institution=p_institution for update;
  if found then
    return existing.state='pending' and exists(select 1 from orbe_private.connection_bindings
      where connection_id=existing.id and owner_id=p_owner_id and external_item_id=p_item_id::text);
  end if;
  insert into public.orbe_connections(owner_id,institution,state) values(p_owner_id,p_institution,'pending') returning id into new_id;
  insert into orbe_private.connection_bindings(connection_id,owner_id,external_item_id) values(new_id,p_owner_id,p_item_id::text);
  return true;
end $$;
revoke all on function public.orbe_stage_connection(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.orbe_stage_connection(uuid,text,uuid) to service_role;
comment on function public.orbe_stage_connection(uuid,text,uuid) is 'Stages pending metadata and private item binding only. Does not verify bank, consent, capabilities or enable reads; exact pending repeats only.';
create or replace function public.orbe_activate_connection(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_session_id uuid,p_evidence jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare conn public.orbe_connections; inventory orbe_private.connection_reads; instant timestamptz;observed timestamptz;proxy_expiry timestamptz;bank_expiry timestamptz;updated timestamptz;item_id uuid;original_id uuid;caps jsonb;digest text;
begin
 if p_evidence is null or jsonb_typeof(p_evidence)<>'object' or (select count(*) from jsonb_object_keys(p_evidence))<>9
  or not(p_evidence ?& array['itemId','originalItemId','institution','observedAt','proxyConsentExpiresAt','bankConsentExpiresAt','bankConsentIndefinite','sourceUpdatedAt','capabilities']) then return false;end if;
 if jsonb_typeof(p_evidence->'originalItemId')<>'string' or jsonb_typeof(p_evidence->'institution')<>'string' or p_evidence->>'institution' not in ('bradesco','mercado-pago','nubank') then return false;end if;
 if jsonb_typeof(p_evidence->'itemId')<>'string' or jsonb_typeof(p_evidence->'observedAt')<>'string' or jsonb_typeof(p_evidence->'proxyConsentExpiresAt')<>'string'
  or jsonb_typeof(p_evidence->'bankConsentIndefinite')<>'boolean' or jsonb_typeof(p_evidence->'bankConsentExpiresAt') not in ('string','null') or jsonb_typeof(p_evidence->'sourceUpdatedAt') not in ('string','null') then return false;end if;
 if exists(select 1 from jsonb_each_text(p_evidence) where key in ('observedAt','proxyConsentExpiresAt','bankConsentExpiresAt','sourceUpdatedAt') and value is not null and value!~'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$') then return false;end if;
 original_id:=(p_evidence->>'originalItemId')::uuid;if original_id::text is distinct from p_evidence->>'originalItemId' then return false;end if;
 item_id:=(p_evidence->>'itemId')::uuid;observed:=(p_evidence->>'observedAt')::timestamptz;proxy_expiry:=(p_evidence->>'proxyConsentExpiresAt')::timestamptz;
 if item_id::text is distinct from p_evidence->>'itemId' then return false;end if;
 bank_expiry:=(p_evidence->>'bankConsentExpiresAt')::timestamptz;updated:=(p_evidence->>'sourceUpdatedAt')::timestamptz;caps:=p_evidence->'capabilities';
 if jsonb_typeof(caps) is distinct from 'object' or (select count(*) from jsonb_object_keys(caps))<>4 or not(caps ?& array['accounts','transactions','investments','reserves'])
  or exists(select 1 from jsonb_each(caps) where jsonb_typeof(value)<>'boolean') or caps->'reserves'<>'false'::jsonb
  or not((caps->>'accounts')::boolean or (caps->>'investments')::boolean) or (caps->>'transactions')::boolean and not(caps->>'accounts')::boolean then return false;end if;
 perform 1 from orbe_private.app_owner where user_id=p_owner_id for update;if not found then return false;end if;
 select * into conn from public.orbe_connections where id=p_connection_id and owner_id=p_owner_id for update;
 if not found or conn.state<>'pending' or conn.institution is distinct from p_evidence->>'institution' or conn.revision is distinct from p_revision or not exists(select 1 from orbe_private.connection_bindings where connection_id=p_connection_id and owner_id=p_owner_id and external_item_id=item_id::text) then return false;end if;
 digest:=orbe_private.movement_session_hash(p_owner_id,p_session_id);if digest is null then return false;end if;
 select * into inventory from orbe_private.connection_reads where connection_id=p_connection_id for update;
 instant:=clock_timestamp();
 if not found or inventory.owner_id is distinct from p_owner_id or inventory.connection_revision is distinct from p_revision or inventory.completed_at is null or inventory.outcome<>'success'
  or inventory.completed_at<instant-interval '15 minutes' or inventory.completed_at>instant
  or observed<instant-interval '120 seconds' or observed>instant or proxy_expiry<=instant or not isfinite(proxy_expiry) or not isfinite(observed)
  or bank_expiry is null and p_evidence->'bankConsentIndefinite'<>'true'::jsonb
  or bank_expiry is not null and (bank_expiry<=instant or not isfinite(bank_expiry) or p_evidence->'bankConsentIndefinite'<>'false'::jsonb)
  or updated is not null and (updated>instant or not isfinite(updated)) then return false;end if;
 if (caps->>'accounts')::boolean and not exists(select 1 from public.orbe_accounts where connection_id=p_connection_id and owner_id=p_owner_id) then return false;end if;
 if orbe_private.movement_session_hash(p_owner_id,p_session_id) is distinct from digest then return false;end if;
 update orbe_private.connection_bindings set external_origin_item_id=original_id where connection_id=p_connection_id and owner_id=p_owner_id;
 update public.orbe_connections set state='active',open_finance_verified_at=observed,proxy_consent_expires_at=proxy_expiry,bank_consent_expires_at=bank_expiry,source_updated_at=updated,
  accounts_available=(caps->>'accounts')::boolean,transactions_available=(caps->>'transactions')::boolean,investments_available=(caps->>'investments')::boolean,reserves_available=false where id=p_connection_id;
 update orbe_private.connection_reads set next_read_at=instant where connection_id=p_connection_id;
 if orbe_private.movement_session_hash(p_owner_id,p_session_id) is distinct from digest or clock_timestamp()>=least(proxy_expiry,coalesce(bank_expiry,proxy_expiry),observed+interval '120 seconds') then raise exception using errcode='Z0001';end if;
 return true;
exception when invalid_parameter_value or invalid_text_representation or invalid_datetime_format or datetime_field_overflow or sqlstate 'Z0001' then return false;
end $$;
revoke all on function public.orbe_activate_connection(uuid,uuid,bigint,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.orbe_activate_connection(uuid,uuid,bigint,uuid,jsonb) to service_role;
comment on function public.orbe_activate_connection(uuid,uuid,bigint,uuid,jsonb) is 'Activates pending only after successful recent inventory and current owner/session/revision plus private adapter evidence. No client approval JSON, financial values, automatic bank capability inference or replay.';

create table orbe_private.connect_flows (
 id uuid primary key,owner_id uuid not null references auth.users(id) on delete cascade,session_hash text not null,
 created_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null,item_id uuid,institution text,
 check(expires_at>created_at and expires_at<=created_at+interval '31 minutes'),check(institution is null or institution in ('bradesco','mercado-pago','nubank'))
);
alter table orbe_private.connect_flows enable row level security;
revoke all on orbe_private.connect_flows from public,anon,authenticated;
create function public.orbe_connect_flow(p_owner_id uuid,p_session_id uuid,p_flow_id uuid,p_operation text,p_item_id uuid default null,p_institution text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare f orbe_private.connect_flows;digest text;c public.orbe_connections;instant timestamptz:=clock_timestamp();
begin
 if p_flow_id is null or p_operation is null or p_operation not in ('begin','inspect','confirm') then return null;end if;
 perform 1 from orbe_private.app_owner where user_id=p_owner_id for update;if not found then return null;end if;
 digest:=orbe_private.movement_session_hash(p_owner_id,p_session_id);if digest is null then return null;end if;
 delete from orbe_private.connect_flows where owner_id=p_owner_id and expires_at<instant-interval '1 day';
 if p_operation='begin' then
  if p_item_id is not null or p_institution is not null or (select count(*) from orbe_private.connect_flows where owner_id=p_owner_id and created_at>instant-interval '1 hour')>=10 then return null;end if;
  insert into orbe_private.connect_flows(id,owner_id,session_hash,expires_at) values(p_flow_id,p_owner_id,digest,instant+interval '30 minutes');
 end if;
 select * into f from orbe_private.connect_flows where id=p_flow_id and owner_id=p_owner_id for update;
 if not found or f.session_hash is distinct from digest or f.expires_at<=clock_timestamp() then return null;end if;
 if p_operation='confirm' then
  if p_item_id is null or p_institution is null or p_institution not in ('bradesco','mercado-pago','nubank') or f.item_id is not null and (f.item_id is distinct from p_item_id or f.institution is distinct from p_institution) then return null;end if;
  select * into c from public.orbe_connections where owner_id=p_owner_id and institution=p_institution for update;
  if found then
   if not exists(select 1 from orbe_private.connection_bindings where connection_id=c.id and owner_id=p_owner_id and external_item_id=p_item_id::text) then return null;end if;
  else
   if not public.orbe_stage_connection(p_owner_id,p_institution,p_item_id) then return null;end if;
   select * into c from public.orbe_connections where owner_id=p_owner_id and institution=p_institution;
  end if;
  update orbe_private.connect_flows set item_id=p_item_id,institution=p_institution where id=p_flow_id;
  if orbe_private.movement_session_hash(p_owner_id,p_session_id) is distinct from digest then raise exception using errcode='Z0001';end if;
  return jsonb_build_object('connectionId',c.id,'institution',c.institution,'revision',c.revision,'state',c.state);
 end if;
 return jsonb_build_object('flowId',f.id);
exception when unique_violation or invalid_text_representation or sqlstate 'Z0001' then return null;
end $$;
revoke all on function public.orbe_connect_flow(uuid,uuid,uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.orbe_connect_flow(uuid,uuid,uuid,text,uuid,text) to service_role;
comment on table orbe_private.connect_flows is 'Technical scoped30min Connect tickets only, no tokens or financial data. Callback provenance revalidated by backend before confirmation.';

commit;
