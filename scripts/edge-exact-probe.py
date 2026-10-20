#!/usr/bin/env python3
"""Fixed numeric-only Edge capability probe. Never reads financial data."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import urllib.request

ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('orbe_admin',ROOT/'scripts/backend-admin.py')
admin=importlib.util.module_from_spec(spec)
spec.loader.exec_module(admin)
SLUG='orbe-runtime-probe'
REF='vvaufaoahotmaocrcyij'
ENTRY="""import { createExactJsonDecoder, exactNumberText } from '../_shared/exact-json.ts';
let supported = false;
try {
  const value = createExactJsonDecoder()('[9007199254740993,0.29]');
  supported = exactNumberText(value[0]) === '9007199254740993' && exactNumberText(value[1]) === '0.29';
} catch { /* Numeric capability only; no runtime or provider output. */ }
Deno.serve(() => new Response(JSON.stringify({ supported, syntheticOnly: true }), {
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
}));
"""

def remote(request):
    rows=request('/functions')
    if not isinstance(rows,list) or any(not isinstance(row,dict) for row in rows):raise admin.SafeError('probe_remote_schema_invalid')
    matches=[row for row in rows if row.get('slug')==SLUG]
    if len(matches)>1:raise admin.SafeError('probe_remote_ambiguous')
    return matches[0] if matches else None

def stage(root):
    directory=root/'supabase/functions'
    (directory/SLUG).mkdir(parents=True)
    (directory/'_shared').mkdir()
    source=(ROOT/'supabase/functions/_shared/exact-json.ts').read_bytes()
    (directory/'_shared/exact-json.ts').write_bytes(source)
    (directory/SLUG/'index.mjs').write_text(ENTRY)
    (root/'supabase/config.toml').write_text('project_id = "orbe-runtime-probe"\n[functions.orbe-runtime-probe]\nverify_jwt = false\nentrypoint = "./functions/orbe-runtime-probe/index.mjs"\n')
    return hashlib.sha256(source).hexdigest()

def main():
    token,ref=admin.config()
    if ref!=REF:raise admin.SafeError('probe_project_mismatch')
    request=admin.client(token,ref)
    admin.inspect(request)
    if remote(request) is not None:raise admin.SafeError('probe_preexisting_function_rejected')
    directory=admin.PRIVATE_CONFIG.parent
    paths={name:directory/('edge-exact-probe.'+name) for name in ('log','json')}
    for path in paths.values():
        if path.is_symlink() or path.exists() and (not path.is_file() or path.stat().st_nlink!=1):raise admin.SafeError('probe_private_path_invalid')
    environment={key:os.environ[key] for key in ('PATH','HOME','USER','LANG','LC_ALL','TMPDIR') if key in os.environ}
    environment.update({'SUPABASE_ACCESS_TOKEN':token,'DO_NOT_TRACK':'1','CI':'1'})
    prefix=['npm','exec','--offline','--yes','--package=supabase@2.121.0','--','supabase','functions']
    descriptor=os.open(paths['log'],os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
    os.chmod(paths['log'],0o600)
    deployed=None; supported=None;removed=False
    with tempfile.TemporaryDirectory(prefix='orbe-exact-probe-') as folder,os.fdopen(descriptor,'w') as log:
        root=Path(folder);source_hash=stage(root)
        try:
            result=subprocess.run(prefix+['deploy',SLUG,'--use-api','--project-ref',ref,'--workdir',str(root)],cwd=ROOT,env=environment,stdout=log,stderr=log,stdin=subprocess.DEVNULL,timeout=180)
            if result.returncode!=0:raise admin.SafeError('probe_deploy_failed_private_log')
            deployed=remote(request)
            if not deployed or deployed.get('status')!='ACTIVE' or deployed.get('verify_jwt') is not False:raise admin.SafeError('probe_deploy_not_confirmed')
            opener=urllib.request.build_opener(admin.NoRedirect())
            req=urllib.request.Request('https://'+ref+'.supabase.co/functions/v1/'+SLUG,headers={'Accept':'application/json'})
            with opener.open(req,timeout=30) as response:
                if response.status!=200 or response.headers.get('cache-control')!='no-store':raise admin.SafeError('probe_http_invalid')
                body=response.read(1025)
            if len(body)>1024:raise admin.SafeError('probe_response_invalid')
            value=json.loads(body)
            if not isinstance(value,dict) or set(value)!={'supported','syntheticOnly'} or value['syntheticOnly'] is not True or type(value['supported']) is not bool:raise admin.SafeError('probe_response_invalid')
            supported=value['supported']
        finally:
            if deployed is not None:
                current=remote(request)
                if not current or current.get('id')!=deployed.get('id') or current.get('version')!=deployed.get('version'):raise admin.SafeError('probe_cleanup_identity_drift')
                result=subprocess.run(prefix+['delete',SLUG,'--yes','--project-ref',ref,'--workdir',str(root)],cwd=ROOT,env=environment,stdout=log,stderr=log,stdin=subprocess.DEVNULL,timeout=90)
                removed=result.returncode==0 and remote(request) is None
                paths['json'].write_text(json.dumps({'decoder_sha256':source_hash,'supported':supported,'temporary_function_removed':removed})+'\n');paths['json'].chmod(0o600)
                if not removed:raise admin.SafeError('probe_cleanup_not_confirmed')
    if supported is not True:raise admin.SafeError('probe_numeric_capability_unavailable')
    print(json.dumps({'edge_exact_json_supported':True,'temporary_function_removed':removed,'provider_calls':0}))

if __name__=='__main__':
    try:main()
    except (admin.SafeError,OSError,ValueError,subprocess.TimeoutExpired) as error:
        print(json.dumps({'error':str(error) if isinstance(error,admin.SafeError) else 'probe_operation_failed'}))
        raise SystemExit(1)
