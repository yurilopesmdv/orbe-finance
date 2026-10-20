#!/usr/bin/env python3
"""Deploy only the permanently disabled Orbe development entrypoint."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('backend_admin', ROOT / 'scripts/backend-admin.py')
admin = importlib.util.module_from_spec(spec)
spec.loader.exec_module(admin)
EXPECTED_ENTRY = """import { createBridgeHandler } from '../_shared/bridge.ts';

// This deployed development entrypoint cannot be enabled through environment.
const ports = {
  async authenticate() { throw new Error('bridge_disabled'); },
  async listConnections() { throw new Error('bridge_disabled'); },
};
Deno.serve(createBridgeHandler(ports, { enabled: false }));
"""
ALLOWED = {'_shared/bridge.ts', '_shared/supabase-rest.ts', '_shared/http-json.ts', '_shared/lease-rest.ts', '_shared/metadata-runtime.ts', 'orbe-bridge/index.mjs'}

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
        if any(value.encode() in content for key, value in private.items() if key in ('SUPABASE_ACCESS_TOKEN', 'ORBE_OWNER_USER_ID') and value):
            raise admin.SafeError('bridge_private_content_rejected')
        files[name] = content
    if set(files) != ALLOWED or files['orbe-bridge/index.mjs'].decode() != EXPECTED_ENTRY:
        raise admin.SafeError('bridge_disabled_entrypoint_required')
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
    for method, suffix, body in [('POST', '/connections/status', b'{}'), ('GET', '/connections/status', None), ('POST', '/connections/status?canary=invented', b'{"canary":"invented"}')]:
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
    print(json.dumps({'disabled_runtime_http_passed': True, 'anonymous_cases': 3, 'financial_requests': 0}))

def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('deploy-disabled', 'smoke-disabled'):
        raise admin.SafeError('bridge_operation_invalid')
    token, ref = admin.config()
    request = admin.client(token, ref)
    admin.inspect(request)  # Confirms dedicated healthy Orbe before any mutation.
    private = admin.private_values()
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
