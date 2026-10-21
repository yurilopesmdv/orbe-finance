#!/usr/bin/env python3
"""Deploy only the permanently disabled Orbe development entrypoint."""
import hashlib
import importlib.util
import json
import os
import stat
from pathlib import Path
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('backend_admin', ROOT / 'scripts/backend-admin.py')
admin = importlib.util.module_from_spec(spec)
spec.loader.exec_module(admin)
EXPECTED_ENTRY = "import { createFinancialRuntime } from '../_shared/financial-runtime.ts';\n\n// Financial release is disabled in code, independently of environment flags.\nDeno.serve(createFinancialRuntime(name => Deno.env.get(name), { liveApproved: false }).handler);\n"
EXPECTED_METADATA_ENTRY = "import { createMetadataRuntime } from '../_shared/metadata-runtime.ts';\n\n// Metadata status only. No financial ingestion or provider credentials.\nDeno.serve(createMetadataRuntime(name => Deno.env.get(name), fetch));\n"
ALLOWED = {'_shared/pluggy-investments.ts', '_shared/movement-runtime.ts', '_shared/movement-finalize-handler.ts', '_shared/movement-handler.ts', '_shared/movement-progress-rest.ts', '_shared/movement-read.ts', '_shared/transaction-cursor.ts', '_shared/pluggy-movements.ts', '_shared/transaction-month.ts', '_shared/movement-identity.ts', '_shared/metadata-runtime.ts', '_shared/account-binding-rest.ts', '_shared/account-runtime.ts', '_shared/account-configuration.ts', '_shared/inventory-discovery.ts', '_shared/bridge.ts', '_shared/read-lease-handler.ts', 'orbe-metadata/index.mjs', '_shared/financial-runtime.ts', 'orbe-bridge/index.mjs', '_shared/lease-rest.ts', '_shared/http-json.ts', '_shared/account-inventory.ts', '_shared/pluggy-item.ts', '_shared/exact-json.ts', '_shared/account-router.ts', '_shared/pending-inventory-rest.ts', '_shared/inventory-handler.ts', '_shared/pluggy-accounts.ts', '_shared/account-network.ts', '_shared/supabase-rest.ts', '_shared/execution-mode.ts', '_shared/pluggy-auth.ts', '_shared/account-read.ts', '_shared/inventory-runtime.ts', '_shared/pluggy-targets.ts'}

def private_canaries(directory, base):
    result = dict(base)
    for name, keys in [('movement-keys.env', {'ORBE_MOVEMENT_IDENTITY_KEY','ORBE_MOVEMENT_CURSOR_KEY'}), ('pluggy.env', {'PLUGGY_CLIENT_ID','PLUGGY_CLIENT_SECRET'}), ('expo-publish.env', {'EXPO_TOKEN'}), ('pluggy-items.json', None)]:
        path = directory / name
        if any(parent.is_symlink() for parent in (directory, *directory.parents)):
            raise admin.SafeError('bridge_private_path_symlink_rejected')
        try: fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        except FileNotFoundError: continue
        with os.fdopen(fd,'rb') as source:
            info = os.fstat(source.fileno())
            if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_nlink != 1 or stat.S_IMODE(info.st_mode) != 0o600:
                raise admin.SafeError('bridge_private_profile_rejected')
            raw = source.read(8193)
        if len(raw)>8192: raise admin.SafeError('bridge_private_profile_rejected')
        if keys is not None:
            seen = set()
            for line in raw.decode('utf-8','strict').splitlines():
                line=line.strip()
                if not line or line.startswith('#'): continue
                if '=' not in line: raise admin.SafeError('bridge_private_profile_rejected')
                key,value=line.split('=',1)
                if key not in keys or key in seen: raise admin.SafeError('bridge_private_profile_rejected')
                seen.add(key);result[key]=value.strip().strip('"').strip("'")
            if seen != keys: raise admin.SafeError('bridge_private_profile_rejected')
            if name == 'movement-keys.env' and (any(not admin.re.fullmatch(r'[0-9a-f]{64}',result[key]) or set(result[key]) == {'0'} for key in keys) or result['ORBE_MOVEMENT_IDENTITY_KEY'] == result['ORBE_MOVEMENT_CURSOR_KEY']):
                raise admin.SafeError('bridge_private_profile_rejected')
        else:
            value=json.loads(raw)
            if not isinstance(value,dict) or value.get('version')!=2 or not isinstance(value.get('items'),list) or not 1<=len(value['items'])<=5:
                raise admin.SafeError('bridge_private_profile_rejected')
            for index,item in enumerate(value['items']):
                if not isinstance(item,dict) or not isinstance(item.get('itemId'),str) or item['itemId'] and not admin.re.fullmatch(r'[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}',item['itemId']):
                    raise admin.SafeError('bridge_private_profile_rejected')
                result['PRIVATE_ITEM_'+str(index)] = item['itemId']
    return result

def artifacts(root, private):
    directory = root / 'supabase/functions'
    if any(parent.is_symlink() for parent in (directory, directory.parent, root)):
        raise admin.SafeError('bridge_source_symlink_rejected')
    files = {}
    for path in directory.rglob('*'):
        if path.is_symlink(): raise admin.SafeError('bridge_source_symlink_rejected')
        if path.is_dir(): continue
        name = path.relative_to(directory).as_posix()
        if name not in ALLOWED: raise admin.SafeError('bridge_unknown_source_file')
        content = path.read_bytes()
        if any(value.encode() in content for key, value in private.items() if key != 'SUPABASE_PROJECT_REF' and value):
            raise admin.SafeError('bridge_private_content_rejected')
        files[name] = content
    if set(files) != ALLOWED or files['orbe-bridge/index.mjs'].decode() != EXPECTED_ENTRY:
        raise admin.SafeError('bridge_disabled_entrypoint_required')
    if files['orbe-metadata/index.mjs'].decode() != EXPECTED_METADATA_ENTRY:
        raise admin.SafeError('bridge_metadata_entrypoint_invalid')
    return {name: hashlib.sha256(content).hexdigest() for name, content in files.items()}

def verify_remote(request):
    rows = request('/functions')
    if not isinstance(rows, list): raise admin.SafeError('bridge_function_schema_invalid')
    matches = [row for row in rows if row.get('slug') == 'orbe-bridge']
    if len(matches) > 1: raise admin.SafeError('bridge_function_ambiguous')
    return matches[0] if matches else None

def smoke(ref):
    if not admin.re.fullmatch('[a-z]{20}', ref): raise admin.SafeError('bridge_project_invalid')
    opener = urllib.request.build_opener(admin.NoRedirect())
    for method, suffix, body in [('POST', '/connections/status', b'{}'), ('GET', '/connections/status', None), ('POST', '/connections/status?canary=invented', b'{"canary":"invented"}'), ('POST','/accounts/discover',b'{}'), ('POST','/accounts/read',b'{}'), ('POST','/reads/acquire',b'{}'), ('POST','/reads/finalize',b'{}')]:
        req = urllib.request.Request('https://' + ref + '.supabase.co/functions/v1/orbe-bridge' + suffix, method=method, data=body, headers={'Content-Type': 'application/json'})
        try:
            with opener.open(req, timeout=30) as response:
                status, headers, data = response.status, response.headers, response.read(1025)
        except urllib.error.HTTPError as error:
            status, headers, data = error.code, error.headers, error.read(1025)
            error.close()
        except (urllib.error.URLError, TimeoutError):
            raise admin.SafeError('bridge_smoke_unavailable') from None
        if status != 503 or headers.get('Cache-Control') != 'no-store' or data != b'{"error":"unavailable"}':
            raise admin.SafeError('bridge_disabled_smoke_failed')
    print(json.dumps({'disabled_runtime_http_passed': True, 'anonymous_cases': 7, 'financial_reads': 0, 'provider_calls': 0}))

def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('deploy-disabled', 'smoke-disabled'):
        raise admin.SafeError('bridge_operation_invalid')
    token, ref = admin.config()
    request = admin.client(token, ref)
    admin.inspect(request)  # Confirms dedicated healthy Orbe before any mutation.
    private = private_canaries(admin.PRIVATE_CONFIG.parent, admin.private_values())
    hashes = artifacts(ROOT, private)
    directory = admin.PRIVATE_CONFIG.parent
    manifest = directory / 'bridge-deploy.json'
    log = directory / 'bridge-deploy.log'
    for path in (manifest, log):
        if path.is_symlink(): raise admin.SafeError('bridge_private_path_symlink_rejected')
    current = verify_remote(request)
    if current:
        if not manifest.is_file(): raise admin.SafeError('bridge_unmanaged_function_rejected')
        recorded = json.loads(manifest.read_text())
        if recorded.get('project_ref') != ref or recorded.get('id') != current.get('id') or recorded.get('version') != current.get('version'):
            raise admin.SafeError('bridge_remote_drift_rejected')
    elif manifest.exists(): raise admin.SafeError('bridge_remote_missing_rejected')
    if sys.argv[1] == 'smoke-disabled':
        if not current or current.get('status') != 'ACTIVE' or current.get('verify_jwt') is not False: raise admin.SafeError('bridge_disabled_deployment_required')
        smoke(ref); return
    environment = {key: os.environ[key] for key in ('PATH', 'HOME', 'USER', 'LANG', 'LC_ALL', 'TMPDIR') if key in os.environ}
    environment.update({'SUPABASE_ACCESS_TOKEN': token, 'DO_NOT_TRACK': '1', 'CI': '1'})
    arguments = ['npm', 'exec', '--offline', '--yes', '--package=supabase@2.121.0', '--', 'supabase', 'functions', 'deploy', 'orbe-bridge', '--use-api', '--project-ref', ref, '--workdir', str(ROOT)]
    descriptor = os.open(log, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    os.chmod(log, 0o600)
    with os.fdopen(descriptor, 'w') as output:
        result = subprocess.run(arguments, cwd=ROOT, env=environment, stdin=subprocess.DEVNULL, stdout=output, stderr=output, timeout=180)
    if result.returncode != 0: raise admin.SafeError('bridge_deploy_failed_see_private_log')
    deployed = verify_remote(request)
    if not deployed or deployed.get('status') != 'ACTIVE' or deployed.get('verify_jwt') is not False:
        raise admin.SafeError('bridge_deployment_verification_failed')
    # No overwrite of a foreign function; preserve identity/version for future drift checks.
    manifest.write_text(json.dumps({'project_ref': ref, 'id': deployed['id'], 'version': deployed['version'], 'source_hashes': hashes}, indent=2) + '\n')
    manifest.chmod(0o600)
    smoke(ref)
    print(json.dumps({'disabled_function_deployed': True, 'version': deployed['version'], 'private_log_outside_metro': True}))

if __name__ == '__main__':
    try:
        main()
    except (admin.SafeError, OSError, ValueError, subprocess.TimeoutExpired) as error:
        print(json.dumps({'error': str(error) if isinstance(error, admin.SafeError) else 'bridge_operation_failed'}))
        sys.exit(1)
