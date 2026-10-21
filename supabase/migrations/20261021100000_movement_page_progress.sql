begin;

create table orbe_private.movement_page_reads (
  connection_id uuid primary key,
  owner_id uuid not null,
  connection_revision bigint not null check(connection_revision>0),
  lease_id uuid not null,
  session_hash text not null check(length(session_hash)=64 and session_hash~'^[0-9a-f]{64}$'),
  month text not null check(length(month)=7 and month~'^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  expected_cursor_hash text check(expected_cursor_hash is null or length(expected_cursor_hash)=64 and expected_cursor_hash~'^[0-9a-f]{64}$'),
  inflight_nonce uuid,
  page_count integer not null default 0 check(page_count between 0 and 100),
  row_count integer not null default 0 check(row_count between 0 and 10000),
  seen_hashes text[] not null default '{}' check(cardinality(seen_hashes)<=100),
  finished boolean not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  foreign key(connection_id,owner_id) references public.orbe_connections(id,owner_id) on delete cascade,
  check(finished=(expected_cursor_hash is null)),
  check(not finished or inflight_nonce is null)
);
alter table orbe_private.movement_page_reads enable row level security;
revoke all on orbe_private.movement_page_reads from public,anon,authenticated,service_role;
comment on table orbe_private.movement_page_reads is 'One bounded page-progress slot per connection/lease. Only hashes of opaque cursors/session, nonce and counters; no raw cursor/query/provider IDs, credentials or financial values. Replaced only by a new valid lease; removed with connection.';

create function orbe_private.movement_session_hash(p_owner_id uuid,p_session_id uuid)
returns text language sql security definer set search_path='' as $$
  select case when exists(select 1 from auth.sessions s where s.id=p_session_id and s.user_id=p_owner_id and (s.not_after is null or s.not_after>clock_timestamp()))
    then pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p_session_id::text,'UTF8')),'hex') else null end;
$$;
revoke all on function orbe_private.movement_session_hash(uuid,uuid) from public,anon,authenticated,service_role;

create function public.orbe_claim_movement_page(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_session_id uuid,p_month text,p_cursor_hash text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare prior orbe_private.movement_page_reads; lease orbe_private.connection_reads; session_digest text; nonce uuid;
begin
  if p_month is null or length(p_month)<>7 or p_month!~'^20[0-9]{2}-(0[1-9]|1[0-2])$'
    or p_cursor_hash is null or length(p_cursor_hash)<>64 or p_cursor_hash!~'^[0-9a-f]{64}$' then return null; end if;
  -- Existing helper locks the connection first and checks registered owner,
  -- revision, consents, transactions capability and current uncompleted lease.
  if not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'transactions') then return null; end if;
  select * into lease from orbe_private.connection_reads where connection_id=p_connection_id for update;
  if not found or lease.owner_id is distinct from p_owner_id or lease.connection_revision is distinct from p_revision or lease.lease_id is distinct from p_lease_id
    or lease.completed_at is not null or lease.lease_expires_at<=clock_timestamp() then return null; end if;
  session_digest:=orbe_private.movement_session_hash(p_owner_id,p_session_id);
  if session_digest is null then return null; end if;
  select * into prior from orbe_private.movement_page_reads where connection_id=p_connection_id for update;
  if not found or prior.lease_id is distinct from p_lease_id then
    if p_cursor_hash<>pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to('orbe:movements:cursor:root:v1','UTF8')),'hex') then return null; end if;
    insert into orbe_private.movement_page_reads(connection_id,owner_id,connection_revision,lease_id,session_hash,month,expected_cursor_hash)
      values(p_connection_id,p_owner_id,p_revision,p_lease_id,session_digest,p_month,p_cursor_hash)
      on conflict(connection_id) do update set owner_id=excluded.owner_id,connection_revision=excluded.connection_revision,lease_id=excluded.lease_id,
        session_hash=excluded.session_hash,month=excluded.month,expected_cursor_hash=excluded.expected_cursor_hash,inflight_nonce=null,
        page_count=0,row_count=0,seen_hashes='{}',finished=false,updated_at=clock_timestamp();
    select * into prior from orbe_private.movement_page_reads where connection_id=p_connection_id for update;
  end if;
  if prior.owner_id is distinct from p_owner_id or prior.connection_revision is distinct from p_revision or prior.session_hash is distinct from session_digest
    or lease.lease_expires_at<=clock_timestamp() or orbe_private.movement_session_hash(p_owner_id,p_session_id) is distinct from session_digest
    or prior.month is distinct from p_month or prior.finished or prior.inflight_nonce is not null or prior.expected_cursor_hash is distinct from p_cursor_hash
    or prior.page_count>=100 or prior.row_count>=10000 or p_cursor_hash=any(prior.seen_hashes) then return null; end if;
  nonce:=pg_catalog.gen_random_uuid();
  update orbe_private.movement_page_reads set inflight_nonce=nonce,page_count=page_count+1,
    seen_hashes=pg_catalog.array_append(seen_hashes,p_cursor_hash),updated_at=clock_timestamp() where connection_id=p_connection_id;
  return jsonb_build_object('claimId',nonce,'pageNumber',prior.page_count+1,'leaseExpiresAt',lease.lease_expires_at);
end $$;
revoke all on function public.orbe_claim_movement_page(uuid,uuid,bigint,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.orbe_claim_movement_page(uuid,uuid,bigint,uuid,uuid,text,text) to service_role;

create function public.orbe_commit_movement_page(p_connection_id uuid,p_owner_id uuid,p_revision bigint,p_lease_id uuid,p_session_id uuid,p_month text,p_cursor_hash text,p_claim_id uuid,p_next_hash text,p_row_count integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare prior orbe_private.movement_page_reads; lease orbe_private.connection_reads; session_digest text;
begin
  if p_month is null or length(p_month)<>7 or p_month!~'^20[0-9]{2}-(0[1-9]|1[0-2])$'
    or p_cursor_hash is null or length(p_cursor_hash)<>64 or p_cursor_hash!~'^[0-9a-f]{64}$' or p_claim_id is null
    or p_next_hash is not null and (length(p_next_hash)<>64 or p_next_hash!~'^[0-9a-f]{64}$')
    or p_row_count is null or p_row_count<0 or p_row_count>500 then return false; end if;
  if not public.orbe_check_connection_read(p_connection_id,p_owner_id,p_revision,p_lease_id,'transactions') then return false; end if;
  select * into lease from orbe_private.connection_reads where connection_id=p_connection_id for update;
  if not found or lease.owner_id is distinct from p_owner_id or lease.connection_revision is distinct from p_revision or lease.lease_id is distinct from p_lease_id
    or lease.completed_at is not null or lease.lease_expires_at<=clock_timestamp() then return false; end if;
  session_digest:=orbe_private.movement_session_hash(p_owner_id,p_session_id);
  if session_digest is null then return false; end if;
  select * into prior from orbe_private.movement_page_reads where connection_id=p_connection_id for update;
  if not found or prior.owner_id is distinct from p_owner_id or prior.connection_revision is distinct from p_revision or prior.lease_id is distinct from p_lease_id
    or prior.session_hash is distinct from session_digest or lease.lease_expires_at<=clock_timestamp()
    or orbe_private.movement_session_hash(p_owner_id,p_session_id) is distinct from session_digest or prior.month is distinct from p_month or prior.finished
    or prior.inflight_nonce is distinct from p_claim_id or prior.expected_cursor_hash is distinct from p_cursor_hash
    or prior.row_count+p_row_count>10000 or p_next_hash=any(prior.seen_hashes)
    or p_next_hash is not null and (prior.page_count>=100 or prior.row_count+p_row_count>=10000) then return false; end if;
  update orbe_private.movement_page_reads set expected_cursor_hash=p_next_hash,inflight_nonce=null,row_count=row_count+p_row_count,
    finished=(p_next_hash is null),updated_at=clock_timestamp() where connection_id=p_connection_id;
  return true;
end $$;
revoke all on function public.orbe_commit_movement_page(uuid,uuid,bigint,uuid,uuid,text,text,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.orbe_commit_movement_page(uuid,uuid,bigint,uuid,uuid,text,text,uuid,text,integer) to service_role;

commit;
