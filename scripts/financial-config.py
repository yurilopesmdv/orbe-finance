#!/usr/bin/env python3
"""Configure own backend credentials only with every financial flag false."""
import hashlib
import hmac
import importlib.util
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import tempfile
import sys
ROOT=Path(__file__).resolve().parent.parent
REF='vvaufaoahotmaocrcyij'
FLAGS=('ORBE_BRIDGE_ENABLED','ORBE_ACCOUNT_READS_ENABLED','ORBE_INVENTORY_DISCOVERY_ENABLED','ORBE_PRIVATE_DATA_APPROVED','ORBE_MOVEMENT_READS_ENABLED','ORBE_INVESTMENT_READS_ENABLED')
TARGETS=set(FLAGS)|{'PLUGGY_CLIENT_ID','PLUGGY_CLIENT_SECRET','ORBE_BACKEND_SECRET_KEY','ORBE_MOVEMENT_IDENTITY_KEY','ORBE_MOVEMENT_CURSOR_KEY'}
SLUGS={'orbe-bridge':'bridge-deploy.json','orbe-metadata':'metadata-deploy.json'}
class SafeError(Exception):pass

def module(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
    value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
admin=module('config_admin','backend-admin.py')
profile=module('config_profile','provider-profile.py')
bridge=module('config_bridge','bridge-deploy.py')
movement_keys=module('config_movement_keys','movement-keys.py')

def digest(value):return hashlib.sha256(value.encode()).hexdigest()

def desired_values(credentials,secret,keys):
    if set(credentials)!={'PLUGGY_CLIENT_ID','PLUGGY_CLIENT_SECRET'} or not re.fullmatch(r'[A-Za-z0-9_-]{1,256}',credentials.get('PLUGGY_CLIENT_ID','')) or not re.fullmatch(r'[A-Za-z0-9._~/-]{16,512}',credentials.get('PLUGGY_CLIENT_SECRET','')) or not isinstance(secret,str) or not re.fullmatch(r'sb_secret_[A-Za-z0-9_-]{1,512}',secret):raise SafeError('disabled_config_invalid')
    if not isinstance(keys,dict) or set(keys)!=set(movement_keys.NAMES) or any(not isinstance(value,str) or not re.fullmatch(r'[0-9a-f]{64}',value) or set(value)=={'0'} for value in keys.values()) or len(set(keys.values()))!=2:raise SafeError('disabled_config_keys_invalid')
    return {**credentials,**keys,'ORBE_BACKEND_SECRET_KEY':secret,**{name:'false' for name in FLAGS}}

def secrets_map(rows):
    if not isinstance(rows,list):raise SafeError('disabled_config_invalid')
    result={}
    for row in rows:
        if not isinstance(row,dict) or not isinstance(row.get('name'),str) or row['name'] in result:raise SafeError('disabled_config_invalid')
        value=row.get('digest',row.get('value'))
        if not isinstance(value,str) or not re.fullmatch(r'[0-9a-f]{64}',value):raise SafeError('disabled_config_invalid')
        result[row['name']]=value
    return result

def functions_map(rows):
    if not isinstance(rows,list) or len(rows)!=2 or {r.get('slug') for r in rows if isinstance(r,dict)}!=set(SLUGS):raise SafeError('disabled_config_functions_rejected')
    result={}
    for row in rows:
        if not isinstance(row.get('id'),str) or type(row.get('version')) is not int or row['version']<1 or row.get('status')!='ACTIVE' or row.get('verify_jwt') is not False or not isinstance(row.get('ezbr_sha256'),str) or not re.fullmatch(r'[0-9a-f]{64}',row['ezbr_sha256']):raise SafeError('disabled_config_functions_rejected')
        result[row['slug']]={key:row[key] for key in ('id','version','ezbr_sha256')}
    return result

def apply_disabled(request,desired,recorded,operation,verify_sources=None):
    if operation not in ('check','configure-disabled') or set(desired)!=TARGETS or any(desired[name]!='false' for name in FLAGS):raise SafeError('disabled_config_invalid')
    desired_values({name:desired[name] for name in ('PLUGGY_CLIENT_ID','PLUGGY_CLIENT_SECRET')},desired['ORBE_BACKEND_SECRET_KEY'],{name:desired[name] for name in movement_keys.NAMES})
    before=functions_map(request('/functions'))
    for slug,fn in before.items():
        receipt=recorded[slug]
        if receipt.get('project_ref')!=REF or receipt.get('id')!=fn['id']:raise SafeError('disabled_config_remote_drift')
        if receipt.get('version')!=fn['version']:
            if type(receipt.get('version')) is not int or fn['version']<receipt['version'] or verify_sources is None or verify_sources(slug,receipt) is not True:raise SafeError('disabled_config_remote_drift')
    prior=secrets_map(request('/secrets'));missing=[]
    for name,value in desired.items():
        if name not in prior:missing.append({'name':name,'value':value})
        elif not hmac.compare_digest(prior[name],digest(value)):raise SafeError('disabled_config_secret_conflict')
    if operation=='check':return {'configuration_ready':not missing,'financial_reads':0,'provider_calls':0},before
    if missing:request('/secrets','POST',missing)
    after=secrets_map(request('/secrets'))
    if any(name not in after or not hmac.compare_digest(after[name],digest(value)) for name,value in desired.items()) or any(after.get(name)!=value for name,value in prior.items() if name not in TARGETS):raise SafeError('disabled_config_verification_failed')
    current=functions_map(request('/functions'))
    for slug,fn in current.items():
        if fn['id']!=before[slug]['id'] or fn['version']<before[slug]['version']:raise SafeError('disabled_config_source_changed')
        if fn['ezbr_sha256']!=before[slug]['ezbr_sha256'] and (verify_sources is None or verify_sources(slug,recorded[slug]) is not True):raise SafeError('disabled_config_source_changed')
    return {'configuration_ready':True,'added_secrets':len(missing),'financial_flags_disabled':True,'financial_reads':0,'provider_calls':0,'bridge_version':current['orbe-bridge']['version'],'metadata_version':current['orbe-metadata']['version']},current

def read_receipt(path):
    if any(p.is_symlink() for p in (path.parent,*path.parent.parents)):raise SafeError('disabled_config_private_path')
    fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
    with os.fdopen(fd,'rb') as source:
        info=os.fstat(source.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid!=os.getuid() or info.st_nlink!=1 or stat.S_IMODE(info.st_mode)!=0o600:raise SafeError('disabled_config_private_path')
        raw=source.read(65537)
    if len(raw)>65536:raise SafeError('disabled_config_receipt_invalid')
    value=json.loads(raw)
    if not isinstance(value,dict):raise SafeError('disabled_config_receipt_invalid')
    return value

def update_receipt(path,before,after):
    fd=os.open(path,os.O_RDWR|os.O_NOFOLLOW|os.O_NONBLOCK)
    with os.fdopen(fd,'r+b') as output:
        info=os.fstat(output.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid!=os.getuid() or info.st_nlink!=1 or stat.S_IMODE(info.st_mode)!=0o600 or json.loads(output.read(65537))!=before:raise SafeError('disabled_config_private_path')
        output.seek(0);output.write((json.dumps(after,indent=2)+'\n').encode());output.truncate()

def verify_function_sources(slug,receipt,token,ref):
    if slug not in SLUGS or ref!=REF or not isinstance(receipt.get('source_hashes'),dict):return False
    env={key:os.environ[key] for key in ('PATH','HOME','USER','LANG','LC_ALL','TMPDIR') if key in os.environ}
    env.update(SUPABASE_ACCESS_TOKEN=token,DO_NOT_TRACK='1',CI='1')
    path=admin.PRIVATE_CONFIG.parent/'financial-config-source-audit.log'
    fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_NOFOLLOW|os.O_APPEND,0o600)
    with os.fdopen(fd,'a') as output:
        info=os.fstat(output.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid!=os.getuid() or info.st_nlink!=1 or stat.S_IMODE(info.st_mode)!=0o600:raise SafeError('disabled_config_private_path')
        with tempfile.TemporaryDirectory(prefix='orbe-source-audit-') as folder:
            result=subprocess.run(['npm','exec','--offline','--yes','--package=supabase@2.121.0','--','supabase','functions','download',slug,'--use-api','--project-ref',ref,'--workdir',folder],env=env,stdin=subprocess.DEVNULL,stdout=output,stderr=output,timeout=120)
            if result.returncode!=0:return False
            directory=Path(folder)/'supabase/functions';entries=list(directory.rglob('*'))
            if any(p.is_symlink() for p in entries):return False
            files=[p for p in entries if p.is_file()]
            names=[p.relative_to(directory).as_posix() for p in files]
            return slug+'/index.mjs' in names and all(receipt['source_hashes'].get(p.relative_to(directory).as_posix())==hashlib.sha256(p.read_bytes()).hexdigest() for p in files)

def execute(operation):
    if operation not in ('check','configure-disabled'):raise SafeError('disabled_config_operation_invalid')
    read_keys=movement_keys.read_keys(admin.PRIVATE_CONFIG.parent)
    token,ref=admin.config()
    if ref!=REF:raise SafeError('disabled_config_project_rejected')
    request=admin.client(token,ref);_,history,_=admin.inspect(request)
    for path in (ROOT/'supabase/migrations').glob('*.sql'):
        name='orbe_'+path.stem+'_'+hashlib.sha256(path.read_bytes()).hexdigest()
        if not any(row.get('name')==name for row in history):raise SafeError('disabled_config_migrations_unverified')
    folder=admin.PRIVATE_CONFIG.parent;receipts={slug:read_receipt(folder/name) for slug,name in SLUGS.items()}
    expected={'orbe-bridge':('orbe-bridge/index.mjs',bridge.EXPECTED_ENTRY),'orbe-metadata':('orbe-metadata/index.mjs',bridge.EXPECTED_METADATA_ENTRY)}
    for slug,(name,source) in expected.items():
        if receipts[slug].get('source_hashes',{}).get(name)!=digest(source):raise SafeError('disabled_config_guard_unverified')
    credentials=profile._profile_values(profile.directory())
    keys=request('/api-keys?reveal=true')
    if not isinstance(keys,list):raise SafeError('disabled_config_keys_unavailable')
    secret=[r.get('api_key') for r in keys if isinstance(r,dict) and r.get('type')=='secret' and r.get('name')=='default']
    public=[r.get('api_key') for r in keys if isinstance(r,dict) and r.get('type')=='publishable' and r.get('name')=='default']
    if len(secret)!=1 or len(public)!=1 or not isinstance(public[0],str) or not public[0].startswith('sb_publishable_'):raise SafeError('disabled_config_keys_unavailable')
    existing=secrets_map(request('/secrets'))
    if existing.get('ORBE_PUBLISHABLE_KEY')!=digest(public[0]) or existing.get('ORBE_METADATA_ENABLED')!=digest('true'):raise SafeError('disabled_config_metadata_unverified')
    result,current=apply_disabled(request,desired_values(credentials,secret[0],read_keys),receipts,operation,lambda slug,receipt:verify_function_sources(slug,receipt,token,ref))
    if operation=='configure-disabled':
        for slug,row in current.items():
            if row['version']!=receipts[slug]['version']:update_receipt(folder/SLUGS[slug],receipts[slug],{**receipts[slug],'version':row['version']})
    return result

if __name__=='__main__':
    try:
        if len(sys.argv)!=2:raise SafeError('disabled_config_operation_invalid')
        print(json.dumps(execute(sys.argv[1])))
    except Exception:
        print(json.dumps({'error':'private_backend_configuration_failed','financial_reads':0}));raise SystemExit(1)
