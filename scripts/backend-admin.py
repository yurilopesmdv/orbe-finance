#!/usr/bin/env python3
"""Orbe development administration. Never prints credentials or raw API responses."""
import hashlib
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUTH_POLICY = {
    'disable_signup': True,
    'external_anonymous_users_enabled': False,
    'external_phone_enabled': False,
    'external_email_enabled': True,
    'password_min_length': 12,
    'jwt_exp': 600,
    'refresh_token_rotation_enabled': True,
    'security_refresh_token_reuse_interval': 10,
    'security_manual_linking_enabled': False,
    'security_update_password_require_reauthentication': True,
    'mailer_autoconfirm': False,
    'mailer_otp_exp': 600,
    'mailer_otp_length': 6,
    'site_url': 'http://127.0.0.1:8083',
    'uri_allow_list': '',
}
class SafeError(Exception):
    pass
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise SafeError('redirect_rejected')

PRIVATE_CONFIG = Path.home() / '.config/orbe-finance/backend.env'

def read_values(path):
    if not path.is_file() or path.is_symlink():
        raise SafeError('private_config_missing')
    result = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' not in line:
            raise SafeError('invalid_private_config')
        key, value = line.split('=', 1)
        key = key.strip()
        if key in result:
            raise SafeError('duplicate_config_key')
        result[key] = value.strip().strip('"').strip("'")
    return result

def private_values():
    pointer = read_values(ROOT / '.env.backend.local')
    if set(pointer) != {'ORBE_BACKEND_ENV_FILE'}:
        raise SafeError('private_pointer_required')
    target = Path(pointer['ORBE_BACKEND_ENV_FILE'])
    if not target.is_absolute() or target != PRIVATE_CONFIG or ROOT.resolve() in target.resolve().parents:
        raise SafeError('private_pointer_rejected')
    if any(parent.is_symlink() for parent in (target, *target.parents)):
        raise SafeError('private_pointer_rejected')
    values = read_values(target)
    if set(values) - {'SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_REF', 'ORBE_OWNER_USER_ID'}:
        raise SafeError('unexpected_private_key')
    target.parent.chmod(0o700)
    target.chmod(0o600)
    return values

def config():
    result = private_values()
    token, ref = result.get('SUPABASE_ACCESS_TOKEN', ''), result.get('SUPABASE_PROJECT_REF', '')
    if not token or not re.fullmatch('[a-z]{20}', ref):
        raise SafeError('invalid_private_config')
    return token, ref

def client(token, ref):
    opener = urllib.request.build_opener(NoRedirect())
    def request(path='', method='GET', body=None):
        if not re.fullmatch(r'(?:/[a-z-]+)*', path) and path != '/api-keys?reveal=true':
            raise SafeError('invalid_management_path')
        req = urllib.request.Request('https://api.supabase.com/v1/projects/' + ref + path,
            data=None if body is None else json.dumps(body).encode(), method=method,
            headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/json', 'Content-Type': 'application/json'})
        try:
            with opener.open(req, timeout=40) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            raise SafeError('management_http_' + str(error.code)) from None
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            raise SafeError('management_unavailable') from None
    return request

def inspect(request):
    project = request()
    if project.get('name', '').lower() not in ('orbe', 'orbe-finance', 'orbe finance') or project.get('status') != 'ACTIVE_HEALTHY':
        raise SafeError('unexpected_project')
    tables = request('/database/query', 'POST', {'query': "select count(*)::int as count from pg_tables where schemaname in ('public','orbe_private')", 'read_only': True})
    history = request('/database/migrations')
    auth = request('/config/auth')
    if not isinstance(history, list) or not isinstance(tables, list):
        raise SafeError('unexpected_management_schema')
    return tables[0]['count'], history, auth

def owner_id():
    import uuid
    values = private_values()
    candidate = values.get('ORBE_OWNER_USER_ID', '')
    try:
        if str(uuid.UUID(candidate)) != candidate:
            raise ValueError()
    except ValueError:
        raise SafeError('owner_uuid_missing_or_invalid') from None
    return candidate

def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('inspect', 'bootstrap', 'migrate', 'set-owner', 'test-owner', 'configure-client', 'test-metadata', 'test-read-leases', 'test-connection-controls', 'test-account-bindings', 'test-movement-pages', 'test-position-bindings'):
        raise SafeError('usage_backend_admin_inspect_or_bootstrap')
    token, ref = config()
    request = client(token, ref)
    tables, history, auth = inspect(request)
    print(json.dumps({'project_confirmed': True, 'application_table_count': tables, 'migration_count': len(history), 'auth_policy_matches': all(auth.get(k) == v for k, v in AUTH_POLICY.items())}))
    if sys.argv[1] == 'inspect':
        return
    if sys.argv[1] in ('migrate', 'set-owner', 'test-owner', 'configure-client', 'test-metadata', 'test-read-leases', 'test-connection-controls', 'test-account-bindings', 'test-movement-pages', 'test-position-bindings'):
        migrations = sorted((ROOT / 'supabase/migrations').glob('*.sql'))
        baseline_prefix = 'orbe_20261016170000_bootstrap_'
        if not any((row.get('name') or '').startswith(baseline_prefix) for row in history):
            raise SafeError('baseline_required')
        pending = []
        for migration in migrations:
            if not re.fullmatch(r'\d{14}_[a-z0-9_]+', migration.stem):
                raise SafeError('invalid_migration_filename')
            content = migration.read_text()
            prefix = 'orbe_' + migration.stem + '_'
            name = prefix + hashlib.sha256(content.encode()).hexdigest()
            existing = [row for row in history if (row.get('name') or '').startswith(prefix)]
            if existing and any(row.get('name') != name for row in existing):
                raise SafeError('applied_migration_hash_mismatch')
            if not existing:
                if sys.argv[1] != 'migrate':
                    raise SafeError('pending_migration')
                pending.append({'name': name, 'query': content})
        for body in pending:
            request('/database/migrations', 'POST', body)
        if sys.argv[1] == 'migrate':
            verified = request('/database/migrations')
            for migration in migrations:
                expected = 'orbe_' + migration.stem + '_' + hashlib.sha256(migration.read_bytes()).hexdigest()
                if not any(row.get('name') == expected for row in verified):
                    raise SafeError('migration_verification_failed')
            print(json.dumps({'versioned_migrations_verified': len(migrations)}))
            return
        if sys.argv[1] == 'test-position-bindings':
            owner = owner_id()
            check_query = "select exists(select 1 from orbe_private.app_owner where user_id='%s'::uuid) as configured" % owner
            before = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if before != [{'configured': True}]:
                raise SafeError('provisioned_owner_required')
            failure = None
            try:
                request('/database/query', 'POST', {'query': (ROOT / 'tests/admin/position-bindings.sql').read_text()})
            except SafeError as error:
                failure = error
            residue_query = "select ((select count(*) from auth.users where id in ('00000000-0000-4000-8000-000000000151','00000000-0000-4000-8000-000000000152')) + (select count(*) from auth.sessions where id in ('70000000-0000-4000-8000-000000000151','70000000-0000-4000-8000-000000000152')) + (select count(*) from public.orbe_connections where id='10000000-0000-4000-8000-000000000151') + (select count(*) from public.orbe_positions where connection_id='10000000-0000-4000-8000-000000000151'))::int as count"
            residue = request('/database/query', 'POST', {'query': residue_query, 'read_only': True})
            after = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if residue != [{'count': 0}] or after != before:
                raise SafeError('position_bindings_test_rollback_failed')
            if failure is not None:
                raise failure
            print(json.dumps({'position_bindings_sql_rollback_checks_passed': True, 'temporary_identities_remaining': 0, 'owner_preserved': True, 'financial_reads': 0}))
            return
        if sys.argv[1] == 'test-movement-pages':
            owner = owner_id()
            check_query = "select exists(select 1 from orbe_private.app_owner where user_id='%s'::uuid) as configured" % owner
            before = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if before != [{'configured': True}]:
                raise SafeError('provisioned_owner_required')
            failure = None
            try:
                request('/database/query', 'POST', {'query': (ROOT / 'tests/admin/movement-pages.sql').read_text()})
            except SafeError as error:
                failure = error
            residue_query = "select ((select count(*) from auth.users where id in ('00000000-0000-4000-8000-000000000131','00000000-0000-4000-8000-000000000132')) + (select count(*) from auth.sessions where id in ('70000000-0000-4000-8000-000000000131','70000000-0000-4000-8000-000000000132','70000000-0000-4000-8000-000000000133')) + (select count(*) from public.orbe_connections where id='10000000-0000-4000-8000-000000000131') + (select count(*) from orbe_private.movement_page_reads where connection_id='10000000-0000-4000-8000-000000000131'))::int as count"
            residue = request('/database/query', 'POST', {'query': residue_query, 'read_only': True})
            after = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if residue != [{'count': 0}] or after != before:
                raise SafeError('movement_pages_test_rollback_failed')
            if failure is not None:
                raise failure
            print(json.dumps({'movement_page_sql_rollback_checks_passed': True, 'temporary_identities_remaining': 0, 'owner_preserved': True, 'parallel_execution_tested': False, 'financial_reads': 0}))
            return
        if sys.argv[1] == 'test-account-bindings':
            owner = owner_id()
            check_query = "select exists(select 1 from orbe_private.app_owner where user_id='%s'::uuid) as configured" % owner
            before = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if before != [{'configured': True}]:
                raise SafeError('provisioned_owner_required')
            failure = None
            try:
                request('/database/query', 'POST', {'query': (ROOT / 'tests/admin/account-bindings.sql').read_text()})
            except SafeError as error:
                failure = error
            residue = request('/database/query', 'POST', {'query': "select ((select count(*) from auth.users where id in ('00000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000112')) + (select count(*) from auth.sessions where id in ('70000000-0000-4000-8000-000000000111','70000000-0000-4000-8000-000000000112')))::int as count", 'read_only': True})
            after = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if residue != [{'count': 0}] or after != before:
                raise SafeError('account_bindings_test_rollback_failed')
            if failure is not None:
                raise failure
            print(json.dumps({'account_bindings_sql_rollback_checks_passed': True, 'temporary_identities_remaining': 0, 'owner_preserved': True}))
            return
        if sys.argv[1] == 'test-connection-controls':
            owner = owner_id()
            check_query = "select exists(select 1 from orbe_private.app_owner where user_id='%s'::uuid) as configured" % owner
            before = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if before != [{'configured': True}]:
                raise SafeError('provisioned_owner_required')
            failure = None
            try:
                request('/database/query', 'POST', {'query': (ROOT / 'tests/admin/connection-controls.sql').read_text()})
            except SafeError as error:
                failure = error
            residue = request('/database/query', 'POST', {'query': "select ((select count(*) from auth.users where id in ('00000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000072')) + (select count(*) from auth.sessions where id in ('70000000-0000-4000-8000-000000000071','70000000-0000-4000-8000-000000000072')))::int as count", 'read_only': True})
            after = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if residue != [{'count': 0}] or after != before:
                raise SafeError('connection_controls_test_rollback_failed')
            if failure is not None:
                raise failure
            print(json.dumps({'connection_controls_sql_rollback_checks_passed': True, 'temporary_identities_remaining': 0, 'owner_preserved': True}))
            return
        if sys.argv[1] == 'test-read-leases':
            owner = owner_id()
            check_query = "select exists(select 1 from orbe_private.app_owner where user_id='%s'::uuid) as configured" % owner
            before = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if before != [{'configured': True}]:
                raise SafeError('provisioned_owner_required')
            request('/database/query', 'POST', {'query': (ROOT / 'tests/admin/read-leases.sql').read_text()})
            residue = request('/database/query', 'POST', {'query': "select count(*)::int as count from auth.users where id in ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000032')", 'read_only': True})
            after = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if residue != [{'count': 0}] or after != before:
                raise SafeError('read_lease_test_rollback_failed')
            print(json.dumps({'read_lease_sql_rollback_checks_passed': True, 'temporary_identities_remaining': 0, 'owner_preserved': True}))
            return
        if sys.argv[1] == 'test-metadata':
            owner = owner_id()
            check_query = "select exists(select 1 from orbe_private.app_owner where user_id='%s'::uuid) as configured" % owner
            before = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if before != [{'configured': True}]:
                raise SafeError('provisioned_owner_required')
            failure = None
            try:
                request('/database/query', 'POST', {'query': (ROOT / 'tests/admin/metadata-access.sql').read_text()})
            except SafeError as error:
                failure = error
            residue = request('/database/query', 'POST', {'query': "select ((select count(*) from auth.users where id in ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012')) + (select count(*) from auth.sessions where id in ('70000000-0000-4000-8000-000000000011','70000000-0000-4000-8000-000000000012')))::int as count", 'read_only': True})
            after = request('/database/query', 'POST', {'query': check_query, 'read_only': True})
            if residue != [{'count': 0}] or after != before:
                raise SafeError('metadata_test_rollback_failed')
            if failure is not None:
                raise failure
            print(json.dumps({'metadata_rls_rollback_checks_passed': True, 'temporary_identities_remaining': 0, 'owner_preserved': True}))
            return
        if sys.argv[1] == 'configure-client':
            keys = request('/api-keys')
            candidates = [entry for entry in keys if entry.get('type') == 'publishable' and entry.get('name') == 'default' and re.fullmatch(r'sb_publishable_[A-Za-z0-9_-]+', entry.get('api_key') or '')]
            if len(candidates) != 1:
                raise SafeError('publishable_key_missing_or_ambiguous')
            public_file = ROOT / '.env.local'
            origin = 'https://' + ref + '.supabase.co'
            if public_file.is_symlink():
                raise SafeError('public_config_symlink_rejected')
            if public_file.exists():
                for line in public_file.read_text().splitlines():
                    if not line.strip() or line.lstrip().startswith('#'):
                        continue
                    if '=' not in line:
                        raise SafeError('unexpected_public_config')
                    key, value = line.split('=', 1)
                    if key.strip() not in ('EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_AUTH_RECOVERY_ENABLED'):
                        raise SafeError('unexpected_public_config')
                    if key.strip() == 'EXPO_PUBLIC_SUPABASE_URL' and value.strip().strip('"').strip("'") != origin:
                        raise SafeError('different_public_project')
            public_file.write_text('EXPO_PUBLIC_SUPABASE_URL=' + origin + '\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=' + candidates[0]['api_key'] + '\n')
            public_file.chmod(0o600)
            # Public client setup is not SMTP/delivery approval. A template PATCH is
            # insufficient evidence; recovery activation needs its own reviewed task.
            with public_file.open('a') as file:
                file.write('EXPO_PUBLIC_AUTH_RECOVERY_ENABLED=false\n')
            print(json.dumps({'public_client_configured': True, 'recovery_enabled': False, 'email_sent': False}))

            return
        if sys.argv[1] == 'test-owner':
            query = (ROOT / 'tests/admin/owner-access.sql').read_text()
            request('/database/query', 'POST', {'query': query})
            residue = request('/database/query', 'POST', {'query': "select count(*)::int as count from auth.users where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002')", 'read_only': True})
            if residue != [{'count': 0}]:
                raise SafeError('test_rollback_verification_failed')
            print(json.dumps({'owner_authorization_rollback_checks_passed': True, 'temporary_identities_remaining': 0}))
            return
        owner = owner_id()
        # UUID is validated before interpolation; no email/password is read or transmitted.
        query = """begin;
        select pg_advisory_xact_lock(1749362501);
        do $owner$ begin
          if not exists(select 1 from auth.users where id = '%s'::uuid and email_confirmed_at is not null and is_anonymous = false) then
            raise exception 'owner_identity_not_confirmed';
          end if;
          if exists(select 1 from orbe_private.app_owner where user_id <> '%s'::uuid) then
            raise exception 'owner_replacement_rejected';
          end if;
          insert into orbe_private.app_owner(singleton,user_id) values(true,'%s'::uuid) on conflict(singleton) do nothing;
        end $owner$;
        commit;""" % (owner, owner, owner)
        request('/database/query', 'POST', {'query': query})
        check = request('/database/query', 'POST', {'query': "select exists(select 1 from orbe_private.app_owner where user_id='%s'::uuid) as configured" % owner, 'read_only': True})
        if check != [{'configured': True}]:
            raise SafeError('owner_verification_failed')
        print(json.dumps({'owner_configured': True}))
        return
    # Bootstrap operates only on the empty development project, never an existing app database.
    if tables != 0:
        raise SafeError('bootstrap_requires_empty_application_database')
    migration = ROOT / 'supabase/migrations/20261016170000_bootstrap.sql'
    content = migration.read_text()
    digest = hashlib.sha256(content.encode()).hexdigest()
    prefix = 'orbe_' + migration.stem + '_'
    name = prefix + digest
    existing = [row for row in history if (row.get('name') or '').startswith(prefix)]
    if existing and any(row.get('name') != name for row in existing):
        raise SafeError('applied_migration_hash_mismatch')
    if not existing:
        request('/database/migrations', 'POST', {'name': name, 'query': content})
    request('/config/auth', 'PATCH', AUTH_POLICY)
    _, updated_history, updated_auth = inspect(request)
    if not any(row.get('name') == name for row in updated_history) or not all(updated_auth.get(k) == v for k, v in AUTH_POLICY.items()):
        raise SafeError('bootstrap_verification_failed')
    checks = request('/database/query', 'POST', {'query': "select exists(select 1 from pg_namespace where nspname='orbe_private') as private_schema, has_schema_privilege('anon','orbe_private','usage') as anon_usage, has_schema_privilege('authenticated','orbe_private','usage') as authenticated_usage", 'read_only': True})
    if checks != [{'private_schema': True, 'anon_usage': False, 'authenticated_usage': False}]:
        raise SafeError('private_schema_privilege_check_failed')
    print(json.dumps({'baseline_applied_and_verified': True, 'auth_policy_verified': True, 'private_schema_denies_client_roles': True, 'financial_records_created': False}))

if __name__ == '__main__':
    try:
        main()
    except SafeError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('backend_admin_failed', file=sys.stderr)
        sys.exit(1)
