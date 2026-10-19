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

def config():
    result = {}
    path = ROOT / '.env.backend.local'
    if not path.is_file() or path.is_symlink():
        raise SafeError('private_config_missing')
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        if key.strip() in result:
            raise SafeError('duplicate_config_key')
        result[key.strip()] = value.strip().strip('"').strip("'")
    token, ref = result.get('SUPABASE_ACCESS_TOKEN', ''), result.get('SUPABASE_PROJECT_REF', '')
    if not token or not re.fullmatch('[a-z]{20}', ref):
        raise SafeError('invalid_private_config')
    path.chmod(0o600)
    return token, ref

def client(token, ref):
    opener = urllib.request.build_opener(NoRedirect())
    def request(path='', method='GET', body=None):
        if not re.fullmatch(r'(?:/[a-z-]+)*', path):
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

def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('inspect', 'bootstrap'):
        raise SafeError('usage_backend_admin_inspect_or_bootstrap')
    token, ref = config()
    request = client(token, ref)
    tables, history, auth = inspect(request)
    print(json.dumps({'project_confirmed': True, 'application_table_count': tables, 'migration_count': len(history), 'auth_policy_matches': all(auth.get(k) == v for k, v in AUTH_POLICY.items())}))
    if sys.argv[1] == 'inspect':
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
