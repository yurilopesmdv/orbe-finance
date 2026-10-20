#!/usr/bin/env python3
"""Create a short-lived private owner activation code; never print its contents."""
import importlib.util
import json
import os
from pathlib import Path
import re
import stat
import sys
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('backend_admin', ROOT / 'scripts/backend-admin.py')
admin = importlib.util.module_from_spec(spec)
spec.loader.exec_module(admin)
OUTPUT = Path.home() / '.config/orbe-finance/owner-setup.txt'

def safe_output(path):
    if not path.is_absolute() or any(p.is_symlink() for p in (path, *path.parents)):
        raise admin.SafeError('unsafe_setup_path')
    if not path.parent.is_dir() or path.parent.stat().st_uid != os.getuid():
        raise admin.SafeError('unsafe_setup_directory')
    path.parent.chmod(0o700)
    if path.exists():
        info = path.lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_nlink != 1:
            raise admin.SafeError('unsafe_setup_file')

def write_setup(path, email, code, expires):
    safe_output(path)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, 'w') as output:
        os.fchmod(output.fileno(), 0o600)
        output.write('Orbe — ativação privada do seu acesso\n\n')
        output.write('E-mail: ' + email + '\nCódigo de ativação: ' + code + '\n')
        output.write('Válido até: ' + time.strftime('%d/%m/%Y %H:%M:%S %Z', time.localtime(expires)) + '\n\n')
        output.write('No app atualizado, toque em Criar meu acesso. Informe o e-mail e o código acima e escolha sua senha (mínimo de 12 caracteres). Depois entre pelo login.\n')
        output.write('Este código não é sua senha. Não o envie por chat nem compartilhe este arquivo. Apague-o depois de usar. Se expirar, execute npm run backend:owner:setup novamente.\n')

def auth_client(ref, service):
    opener = urllib.request.build_opener(admin.NoRedirect())
    def request(path, method='GET', body=None):
        if not (re.fullmatch(r'/admin/users/[0-9a-f-]{36}', path) and method == 'GET' and body is None) and not (path == '/admin/generate_link' and method == 'POST' and isinstance(body, dict) and set(body) == {'type', 'email'} and body['type'] == 'recovery'):
            raise admin.SafeError('invalid_setup_operation')
        req = urllib.request.Request('https://' + ref + '.supabase.co/auth/v1' + path, method=method,
            data=None if body is None else json.dumps(body).encode(),
            headers={'apikey': service, 'Authorization': 'Bearer ' + service, 'Content-Type': 'application/json', 'Accept': 'application/json'})
        try:
            with opener.open(req, timeout=25) as response:
                raw = response.read(131073)
                if len(raw) > 131072:
                    raise admin.SafeError('setup_response_too_large')
                return json.loads(raw)
        except urllib.error.HTTPError as error:
            raise admin.SafeError('setup_http_' + str(error.code)) from None
        except (urllib.error.URLError, TimeoutError, ValueError):
            raise admin.SafeError('setup_unavailable') from None
    return request

def prepare(request, owner, auth, auth_request, output=OUTPUT, now=time.time):
    safe_output(output)  # Reject unsafe paths before generating a credential.
    if auth.get('disable_signup') is not True or auth.get('mailer_otp_length') != 6 or auth.get('mailer_otp_exp') != 600:
        raise admin.SafeError('private_setup_policy_required')
    configured = request('/database/query', 'POST', {'query': "select exists(select 1 from orbe_private.app_owner where user_id='%s'::uuid) as configured" % owner, 'read_only': True})
    if configured != [{'configured': True}]:
        raise admin.SafeError('provisioned_owner_required')
    user = auth_request('/admin/users/' + owner)
    email = user.get('email') if isinstance(user, dict) else None
    if not isinstance(user, dict) or user.get('id') != owner or user.get('is_anonymous') is not False or not user.get('email_confirmed_at') or not isinstance(email, str) or len(email) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
        raise admin.SafeError('unexpected_setup_owner')
    started = now()
    generated = auth_request('/admin/generate_link', 'POST', {'type': 'recovery', 'email': email})
    if not isinstance(generated, dict) or generated.get('id') != owner or generated.get('email') != email or generated.get('verification_type') != 'recovery' or not isinstance(generated.get('email_otp'), str) or not re.fullmatch(r'[0-9]{6}', generated['email_otp']):
        raise admin.SafeError('unexpected_setup_code')
    if now() >= started + 600:
        raise admin.SafeError('setup_code_expired')
    write_setup(output, email, generated['email_otp'], started + 600)

def main():
    if len(sys.argv) != 1:
        raise admin.SafeError('usage_owner_setup_without_arguments')
    token, ref = admin.config()
    request = admin.client(token, ref)
    _, _, auth = admin.inspect(request)
    owner = admin.owner_id()
    keys = request('/api-keys')
    if not isinstance(keys, list):
        raise admin.SafeError('setup_keys_missing')
    service = next((k.get('api_key') for k in keys if isinstance(k, dict) and k.get('name') == 'service_role' and k.get('type') == 'legacy'), None)
    if not isinstance(service, str) or not service:
        raise admin.SafeError('setup_keys_missing')
    prepare(request, owner, auth, auth_client(ref, service))
    print('owner_setup_saved_privately=true; expires_in_seconds=600; public_signup_disabled=true')

if __name__ == '__main__':
    try: main()
    except admin.SafeError as error:
        print(str(error), file=sys.stderr); sys.exit(1)
    except Exception:
        print('owner_setup_failed', file=sys.stderr); sys.exit(1)
