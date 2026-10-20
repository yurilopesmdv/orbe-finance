#!/usr/bin/env python3
"""Dedicated metadata-only deployment. Never accesses bank data or owner credentials."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tomllib
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('bridge_deploy', ROOT / 'scripts/bridge-deploy.py')
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)
admin = bridge.admin
SLUG = 'orbe-metadata'

def public_config(root, ref):
    values = admin.read_values(root / '.env.local')
    allowed = {'EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_AUTH_RECOVERY_ENABLED'}
    if set(values) - allowed or values.get('EXPO_PUBLIC_SUPABASE_URL') != 'https://' + ref + '.supabase.co':
        raise admin.SafeError('metadata_public_origin_invalid')
    key = values.get('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    if not admin.re.fullmatch(r'sb_publishable_[A-Za-z0-9_-]+', key):
        raise admin.SafeError('metadata_public_key_invalid')
    return key

def validate_function_config(root):
    path = root / 'supabase/config.toml'
    if path.is_symlink(): raise admin.SafeError('metadata_function_config_invalid')
    try: configuration = tomllib.loads(path.read_text())
    except (ValueError, OSError): raise admin.SafeError('metadata_function_config_invalid') from None
    if configuration.get('functions', {}).get(SLUG) != {'verify_jwt':False, 'entrypoint':'./functions/orbe-metadata/index.mjs'}:
        raise admin.SafeError('metadata_function_config_invalid')

def remote(request):
    rows = request('/functions')
    if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
        raise admin.SafeError('metadata_function_schema_invalid')
    matches = [row for row in rows if row.get('slug') == SLUG]
    if len(matches) > 1: raise admin.SafeError('metadata_function_ambiguous')
    return matches[0] if matches else None

def preflight(current, manifest, ref):
    if manifest.is_symlink(): raise admin.SafeError('metadata_private_path_rejected')
    if current:
        if not manifest.is_file(): raise admin.SafeError('metadata_unmanaged_function_rejected')
        recorded = json.loads(manifest.read_text())
        if not isinstance(recorded, dict) or any(recorded.get(key) != value for key, value in {'project_ref':ref, 'id':current.get('id'), 'version':current.get('version')}.items()):
            raise admin.SafeError('metadata_remote_drift_rejected')
    elif manifest.exists(): raise admin.SafeError('metadata_remote_missing_rejected')

def smoke(ref):
    if not admin.re.fullmatch('[a-z]{20}', ref): raise admin.SafeError('metadata_project_invalid')
    opener = urllib.request.build_opener(admin.NoRedirect())
    cases = [
        ('POST', '/connections/status', b'{}', {}, 401, 'unauthorized'),
        ('POST', '/connections/status', b'{}', {'Authorization':'Bearer invented.invalid.signature'}, 401, 'unauthorized'),
        ('GET', '/connections/status', None, {}, 405, 'method_not_allowed'),
        ('POST', '/transactions', b'{}', {}, 404, 'not_found'),
        ('POST', '/connections/status?canary=invented', b'{}', {}, 400, 'invalid_request'),
    ]
    for method, suffix, body, headers, expected, code in cases:
        request = urllib.request.Request('https://' + ref + '.supabase.co/functions/v1/' + SLUG + suffix, method=method, data=body, headers={'Content-Type':'application/json', **headers})
        try:
            with opener.open(request, timeout=30) as response:
                status, metadata, data = response.status, response.headers, response.read(1025)
        except urllib.error.HTTPError as error:
            try: status, metadata, data = error.code, error.headers, error.read(1025)
            finally: error.close()
        except (urllib.error.URLError, TimeoutError):
            raise admin.SafeError('metadata_http_unavailable') from None
        if status != expected or metadata.get('Cache-Control') != 'no-store' or data != json.dumps({'error':code}, separators=(',',':')).encode():
            raise admin.SafeError('metadata_http_smoke_failed')
    bridge.smoke(ref)
    print(json.dumps({'metadata_negative_http_passed':True, 'cases':len(cases), 'owner_positive_tested':False, 'financial_requests':0}))

def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('deploy-metadata', 'smoke-metadata'):
        raise admin.SafeError('metadata_operation_invalid')
    token, ref = admin.config(); request = admin.client(token, ref)
    admin.inspect(request)
    hashes = bridge.artifacts(ROOT, admin.private_values())
    validate_function_config(ROOT)
    key = public_config(ROOT, ref)
    directory = admin.PRIVATE_CONFIG.parent
    manifest, log, config_file = (directory / name for name in ('metadata-deploy.json','metadata-deploy.log','metadata-runtime.env'))
    for path in (manifest, log, config_file):
        if path.is_symlink(): raise admin.SafeError('metadata_private_path_rejected')
    current = remote(request); preflight(current, manifest, ref)
    if sys.argv[1] == 'smoke-metadata':
        if not current or current.get('status') != 'ACTIVE' or current.get('verify_jwt') is not False:
            raise admin.SafeError('metadata_active_function_required')
        smoke(ref); return
    environment = {name:os.environ[name] for name in ('PATH','HOME','USER','LANG','LC_ALL','TMPDIR') if name in os.environ}
    environment.update({'SUPABASE_ACCESS_TOKEN':token, 'DO_NOT_TRACK':'1', 'CI':'1'})
    prefix = ['npm','exec','--offline','--yes','--package=supabase@2.121.0','--','supabase']
    descriptor = os.open(log, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
    os.chmod(log, 0o600)
    with os.fdopen(descriptor, 'w') as output:
        def run(arguments):
            result = subprocess.run(prefix + arguments, cwd=ROOT, env=environment, stdin=subprocess.DEVNULL, stdout=output, stderr=output, timeout=180)
            if result.returncode != 0: raise admin.SafeError('metadata_cli_failed_see_private_log')
        def configure(enabled):
            descriptor = os.open(config_file, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
            os.chmod(config_file, 0o600)
            with os.fdopen(descriptor, 'w') as config:
                config.write('ORBE_METADATA_ENABLED=' + ('true' if enabled else 'false') + '\nORBE_PUBLISHABLE_KEY=' + key + '\n')
            try: run(['secrets','set','--env-file',str(config_file),'--project-ref',ref])
            finally: config_file.unlink(missing_ok=True)
        def deploy():
            run(['functions','deploy',SLUG,'--use-api','--project-ref',ref,'--workdir',str(ROOT)])
            deployed = remote(request)
            if not deployed or deployed.get('status') != 'ACTIVE' or deployed.get('verify_jwt') is not False or not deployed.get('id') or not isinstance(deployed.get('version'), int):
                raise admin.SafeError('metadata_deployment_verification_failed')
            descriptor = os.open(manifest, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
            os.chmod(manifest, 0o600)
            with os.fdopen(descriptor, 'w') as record:
                record.write(json.dumps({'project_ref':ref,'id':deployed['id'],'version':deployed['version'],'source_hashes':hashes},indent=2)+'\n')
            return deployed
        try:
            configure(False); deploy()
            configure(True); deployed = deploy()
            smoke(ref)
        except (admin.SafeError, OSError, ValueError, subprocess.TimeoutExpired):
            try: configure(False)
            except (admin.SafeError, OSError, subprocess.TimeoutExpired): pass
            raise
    print(json.dumps({'metadata_function_deployed':True, 'version':deployed['version'], 'financial_ingestion_enabled':False, 'private_log_outside_metro':True}))

if __name__ == '__main__':
    try: main()
    except (admin.SafeError, OSError, ValueError, subprocess.TimeoutExpired) as error:
        print(json.dumps({'error':str(error) if isinstance(error,admin.SafeError) else 'metadata_operation_failed'})); sys.exit(1)
