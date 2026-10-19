#!/usr/bin/env python3
"""Optional real-development Auth denial smoke with a disposable invented identity."""
import importlib.util
import json
import os
from pathlib import Path
import secrets
import subprocess
import sys
import urllib.error
import urllib.request
import uuid
ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('backend_admin', ROOT / 'scripts/backend-admin.py')
admin = importlib.util.module_from_spec(spec)
spec.loader.exec_module(admin)

def main():
    token, ref = admin.config()
    request = admin.client(token, ref)
    _, _, auth = admin.inspect(request)
    if not auth.get('disable_signup'):
        raise admin.SafeError('signup_must_be_disabled')
    owner = admin.owner_id()
    keys = request('/api-keys')
    service = next((k['api_key'] for k in keys if k.get('name') == 'service_role' and k.get('type') == 'legacy'), None)
    public = next((k['api_key'] for k in keys if k.get('name') == 'default' and k.get('type') == 'publishable'), None)
    if not service or not public:
        raise admin.SafeError('development_api_keys_missing')
    opener = urllib.request.build_opener(admin.NoRedirect())
    origin = 'https://' + ref + '.supabase.co'
    def auth_request(path, method, body=None):
        if path != '/admin/users' and not path.startswith('/admin/users/'):
            raise admin.SafeError('invalid_smoke_path')
        req = urllib.request.Request(origin + '/auth/v1' + path, method=method, data=None if body is None else json.dumps(body).encode(), headers={'apikey': service, 'Authorization': 'Bearer ' + service, 'Content-Type': 'application/json'})
        try:
            with opener.open(req, timeout=25) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            raise admin.SafeError('smoke_admin_http_' + str(error.code)) from None
    email = 'orbe-smoke-' + uuid.uuid4().hex + '@example.invalid'
    password = secrets.token_urlsafe(32)
    identity = None
    try:
        created = auth_request('/admin/users', 'POST', {'email': email, 'password': password, 'email_confirm': True})
        identity = str(uuid.UUID(created['id']))
        if identity == owner or created.get('email') != email:
            identity = None
            raise admin.SafeError('unexpected_smoke_identity')
        # Child receives only public configuration and invented credentials, never admin keys.
        completed = subprocess.run(['node', str(ROOT / 'tests/auth/live-denial.mjs')], cwd=ROOT,
            input=json.dumps({'origin': origin, 'publishableKey': public, 'email': email, 'password': password}), text=True,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=100, env={k: v for k, v in os.environ.items() if k not in ('SUPABASE_ACCESS_TOKEN','SUPABASE_SERVICE_ROLE_KEY')})
        if completed.returncode != 0 or completed.stdout.strip() != 'live_non_owner_and_anonymous_denied=true':
            raise admin.SafeError('live_auth_denial_check_failed')
        print('live_non_owner_and_anonymous_denied=true')
    finally:
        if identity:
            auth_request('/admin/users/' + identity, 'DELETE')
            print('synthetic_identity_deleted=true')

if __name__ == '__main__':
    try: main()
    except admin.SafeError as error:
        print(str(error), file=sys.stderr); sys.exit(1)
    except Exception:
        print('auth_smoke_failed', file=sys.stderr); sys.exit(1)
