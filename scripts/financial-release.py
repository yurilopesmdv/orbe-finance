#!/usr/bin/env python3
"""Scoped existing-owner release. Never calls bank product endpoints or stores values."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys
import stat
import time
ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('release_config',ROOT/'scripts/financial-config.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
FILES=('app.json','package-lock.json','src/config/runtime.ts')

def transition(request,desired,receipts,enabled,verify):
    before=c.functions_map(request('/functions'));prior=c.secrets_map(request('/secrets'))
    for slug,row in before.items():
        recorded=receipts[slug]
        if recorded.get('project_ref')!=c.REF or recorded.get('id')!=row['id'] or row['version']<recorded.get('version',0) or verify(slug,recorded) is not True:raise c.SafeError('release_source_unverified')
    for name,value in desired.items():
        allowed={c.digest('false'),c.digest('true')} if name in c.FLAGS else {c.digest(value)}
        if prior.get(name) not in allowed:raise c.SafeError('release_secret_unverified')
    selected='true' if enabled else 'false'
    changed=[{'name':name,'value':selected} for name in c.FLAGS if prior.get(name)!=c.digest(selected)]
    def confirmed():
        current=c.secrets_map(request('/secrets'))
        return all(current.get(name)==c.digest(selected) for name in c.FLAGS) and all(current.get(name)==value for name,value in prior.items() if name not in c.FLAGS)
    try:
        if changed:request('/secrets','POST',changed)
        ready=confirmed()
        for delay in (0.25,0.5,1,2,2):
            if ready:break
            time.sleep(delay);ready=confirmed()
        if not ready:raise c.SafeError('release_confirmation_failed')
        after=c.functions_map(request('/functions'))
        for slug,row in after.items():
            if row['id']!=before[slug]['id'] or row['version']<before[slug]['version'] or verify(slug,receipts[slug]) is not True:raise c.SafeError('release_source_unverified')
        return after
    except Exception:
        # No automatic retry of activation. Roll back flags, never credentials.
        if enabled:
            try:request('/secrets','POST',[{'name':name,'value':'false'} for name in c.FLAGS])
            except Exception:pass
        raise

def execute(operation):
    if operation not in ('enable-owner','disable'):raise c.SafeError('release_operation_invalid')
    enabled=operation=='enable-owner';token,ref=c.admin.config()
    if ref!=c.REF:raise c.SafeError('release_project_invalid')
    request=c.admin.client(token,ref);_,history,_=c.admin.inspect(request)
    migrations=list((ROOT/'supabase/migrations').glob('*.sql'))
    if len(migrations)!=20:raise c.SafeError('release_migrations_unverified')
    for file in migrations:
        if not any(row.get('name')=='orbe_'+file.stem+'_'+hashlib.sha256(file.read_bytes()).hexdigest() for row in history):raise c.SafeError('release_migrations_unverified')
    folder=c.admin.PRIVATE_CONFIG.parent;receipts={slug:c.read_receipt(folder/name) for slug,name in c.SLUGS.items()}
    if enabled and receipts['orbe-bridge'].get('source_hashes')!=c.bridge.artifacts(ROOT,c.bridge.private_canaries(folder,c.admin.private_values())):raise c.SafeError('release_local_sources_unverified')
    credentials=c.profile._profile_values(c.profile.directory());keys=c.movement_keys.read_keys(folder)
    api=request('/api-keys?reveal=true');secret=[r.get('api_key') for r in api if r.get('type')=='secret' and r.get('name')=='default']
    if len(secret)!=1:raise c.SafeError('release_backend_key_unavailable')
    desired=c.desired_values(credentials,secret[0],keys)
    current=transition(request,desired,receipts,enabled,lambda slug,receipt:c.verify_function_sources(slug,receipt,token,ref))
    for slug,row in current.items():
        if row['version']!=receipts[slug]['version']:c.update_receipt(folder/c.SLUGS[slug],receipts[slug],{**receipts[slug],'version':row['version']})
    receipt={'version':1,'enabled':enabled,'projectRef':ref,'projectId':'69843dfe-ab1b-469e-bb78-c7948bbf1d9b','runtime':'58.0.0','scope':'existing-owner-only','files':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in FILES}}
    dest=folder/'financial-release.json'
    fd=os.open(dest,os.O_WRONLY|os.O_CREAT|os.O_NOFOLLOW|os.O_NONBLOCK,0o600)
    with os.fdopen(fd,'w') as output:
        info=os.fstat(output.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid!=os.getuid() or info.st_nlink!=1 or stat.S_IMODE(info.st_mode)!=0o600:raise c.SafeError('release_private_path_invalid')
        output.seek(0);json.dump(receipt,output);output.truncate()
    return {'owner_release_enabled':enabled,'financial_reads':0,'provider_calls':0,'bridge_version':current['orbe-bridge']['version'],'metadata_version':current['orbe-metadata']['version']}
if __name__=='__main__':
    try:
        if len(sys.argv)!=2:raise c.SafeError('release_operation_invalid')
        print(json.dumps(execute(sys.argv[1])))
    except Exception:
        print(json.dumps({'error':'owner_release_failed','financial_reads':0}));raise SystemExit(1)
