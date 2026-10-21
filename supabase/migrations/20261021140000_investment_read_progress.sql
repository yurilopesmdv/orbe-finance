begin;
create table orbe_private.investment_reads (
 connection_id uuid primary key,
 owner_id uuid not null,
 connection_revision bigint not null check(connection_revision>0),
 lease_id uuid not null,
 session_hash text not null check(length(session_hash)=64 and session_hash~'^[0-9a-f]{64}$'),
 claim_id uuid not null,
 committed boolean not null default false,
 row_count integer not null default 0 check(row_count between 0 and 1000),
 updated_at timestamptz not null default clock_timestamp(),
 foreign key(connection_id,owner_id) references public.orbe_connections(id,owner_id) on delete cascade
);
alter table orbe_private.investment_reads enable row level security;
revoke all on orbe_private.investment_reads from public,anon,authenticated,service_role;
comment on table orbe_private.investment_reads is 'One-shot investment read fencing: session hash, claim, counters only. No financial values or provider IDs.';
create function public.orbe_claim_investment_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_session_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare prior orbe_private.investment_reads; lease orbe_private.connection_reads; digest text; nonce uuid;
begin
 if not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'investments') then return null;end if;
 select * into lease from orbe_private.connection_reads where connection_id=p_connection_id for update;
 digest:=orbe_private.movement_session_hash(p_owner_id,p_session_id);
 if digest is null or lease.lease_expires_at<=clock_timestamp() then return null;end if;
 select * into prior from orbe_private.investment_reads where connection_id=p_connection_id for update;
 if found and prior.lease_id=p_lease_id then return null;end if;
 nonce:=pg_catalog.gen_random_uuid();
 insert into orbe_private.investment_reads(connection_id,owner_id,connection_revision,lease_id,session_hash,claim_id)
 values(p_connection_id,p_owner_id,p_revision,p_lease_id,digest,nonce)
 on conflict(connection_id) do update set owner_id=excluded.owner_id,connection_revision=excluded.connection_revision,lease_id=excluded.lease_id,session_hash=excluded.session_hash,claim_id=excluded.claim_id,committed=false,row_count=0,updated_at=clock_timestamp();
 if orbe_private.movement_session_hash(p_owner_id,p_session_id) is distinct from digest or not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'investments') then raise exception using errcode='Z0001';end if;
 return jsonb_build_object('claimId',nonce,'leaseExpiresAt',lease.lease_expires_at);
exception when sqlstate 'Z0001' then return null;
end $$;
create function public.orbe_commit_investment_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_session_id uuid,p_claim_id uuid,p_row_count integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare prior orbe_private.investment_reads; digest text;
begin
 if p_claim_id is null or p_row_count is null or p_row_count<0 or p_row_count>1000 then return false;end if;
 if not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'investments') then return false;end if;
 digest:=orbe_private.movement_session_hash(p_owner_id,p_session_id);if digest is null then return false;end if;
 select * into prior from orbe_private.investment_reads where connection_id=p_connection_id for update;
 if not found or prior.owner_id is distinct from p_owner_id or prior.connection_revision is distinct from p_revision or prior.lease_id is distinct from p_lease_id or prior.session_hash is distinct from digest or prior.claim_id is distinct from p_claim_id or prior.committed then return false;end if;
 update orbe_private.investment_reads set committed=true,row_count=p_row_count,updated_at=clock_timestamp() where connection_id=p_connection_id;
 if orbe_private.movement_session_hash(p_owner_id,p_session_id) is distinct from digest or not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'investments') then raise exception using errcode='Z0001';end if;
 return true;
exception when sqlstate 'Z0001' then return false;
end $$;
create or replace function public.orbe_finish_connection_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_outcome text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare connection public.orbe_connections; prior orbe_private.connection_reads; instant timestamptz;
begin
 if p_outcome is null or p_outcome not in ('success','failed','cancelled') then return false;end if;
 select * into connection from public.orbe_connections where id=p_connection_id for update;
 if not found or not orbe_private.connection_read_eligible(connection,p_owner_id,p_revision) then return false;end if;
 select * into prior from orbe_private.connection_reads where connection_id=p_connection_id for update;
 instant:=clock_timestamp();
 if not found or prior.owner_id<>p_owner_id or prior.connection_revision<>p_revision or prior.lease_id is distinct from p_lease_id or prior.completed_at is not null or prior.lease_expires_at<=instant then return false;end if;
 if p_outcome='success' and (
 exists(select 1 from orbe_private.movement_page_reads m where m.connection_id=p_connection_id and m.lease_id=p_lease_id and (not m.finished or m.inflight_nonce is not null))
 or exists(select 1 from orbe_private.investment_reads i where i.connection_id=p_connection_id and i.lease_id=p_lease_id and not i.committed)
 ) then return false;end if;
 update orbe_private.connection_reads set completed_at=instant,outcome=p_outcome,lease_expires_at=instant where connection_id=p_connection_id;
 if p_outcome='success' then update public.orbe_connections set last_read_at=instant where id=p_connection_id;end if;
 return true;
end $$;
create function public.orbe_finish_investment_read(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_session_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare prior orbe_private.investment_reads;digest text;
begin
 if not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'investments') then return false;end if;
 digest:=orbe_private.movement_session_hash(p_owner_id,p_session_id);if digest is null then return false;end if;
 select * into prior from orbe_private.investment_reads where connection_id=p_connection_id for update;
 if not found or prior.owner_id is distinct from p_owner_id or prior.connection_revision is distinct from p_revision or prior.lease_id is distinct from p_lease_id or prior.session_hash is distinct from digest or not prior.committed or orbe_private.movement_session_hash(p_owner_id,p_session_id) is distinct from digest then return false;end if;
 return public.orbe_finish_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'success');
end $$;
revoke all on function public.orbe_claim_investment_read(uuid,uuid,bigint,uuid,uuid) from public,anon,authenticated;
revoke all on function public.orbe_commit_investment_read(uuid,uuid,bigint,uuid,uuid,uuid,integer) from public,anon,authenticated;
revoke all on function public.orbe_finish_investment_read(uuid,uuid,bigint,uuid,uuid) from public,anon,authenticated;
grant execute on function public.orbe_claim_investment_read(uuid,uuid,bigint,uuid,uuid) to service_role;
grant execute on function public.orbe_commit_investment_read(uuid,uuid,bigint,uuid,uuid,uuid,integer) to service_role;
grant execute on function public.orbe_finish_investment_read(uuid,uuid,bigint,uuid,uuid) to service_role;
commit;
