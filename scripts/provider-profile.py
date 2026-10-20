#!/usr/bin/env python3
"""Prepare/check a private technical profile. Never contacts provider or prints credentials."""
import json
import os
from pathlib import Path
import re
import stat
import sys
import urllib.request
import urllib.error
PRIVATE_DIR=Path.home()/'.config/orbe-finance'
NAME='pluggy.env'
TEMPLATE='# Orbe only. Keep outside the app and never paste these values in chat.\nPLUGGY_CLIENT_ID=\nPLUGGY_CLIENT_SECRET=\n'
class SafeError(Exception):pass

def directory():
    if any(path.is_symlink() for path in (PRIVATE_DIR,*PRIVATE_DIR.parents)):raise SafeError('provider_profile_path_rejected')
    PRIVATE_DIR.mkdir(parents=True,mode=0o700,exist_ok=True)
    value=PRIVATE_DIR.stat()
    if not stat.S_ISDIR(value.st_mode) or value.st_uid!=os.getuid():raise SafeError('provider_profile_owner_rejected')
    PRIVATE_DIR.chmod(0o700)
    return PRIVATE_DIR/NAME

def _profile_values(path):
    if path.is_symlink():raise SafeError('provider_profile_path_rejected')
    try:fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW)
    except OSError:raise SafeError('provider_profile_missing_or_invalid') from None
    with os.fdopen(fd,'rb') as source:
        value=os.fstat(source.fileno())
        if not stat.S_ISREG(value.st_mode) or value.st_uid!=os.getuid() or value.st_nlink!=1:raise SafeError('provider_profile_owner_or_links_rejected')
        if stat.S_IMODE(value.st_mode)!=0o600:raise SafeError('provider_profile_permissions_rejected')
        raw=source.read(8193)
    if len(raw)>8192:raise SafeError('provider_profile_invalid')
    try:text=raw.decode('utf-8','strict')
    except UnicodeError:raise SafeError('provider_profile_invalid') from None
    values={}
    for line in text.splitlines():
        line=line.strip()
        if not line or line.startswith('#'):continue
        if '=' not in line:raise SafeError('provider_profile_invalid')
        key,value=line.split('=',1)
        if key not in ('PLUGGY_CLIENT_ID','PLUGGY_CLIENT_SECRET') or key in values:raise SafeError('provider_profile_invalid')
        values[key]=value
    if set(values)!={'PLUGGY_CLIENT_ID','PLUGGY_CLIENT_SECRET'}:raise SafeError('provider_profile_invalid')
    identifier,secret=values['PLUGGY_CLIENT_ID'],values['PLUGGY_CLIENT_SECRET']
    if identifier=='' and secret=='':return values
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,256}',identifier) or not re.fullmatch(r'[A-Za-z0-9._~/-]{16,512}',secret):raise SafeError('provider_profile_invalid')
    return values

def read_profile(path):
    values=_profile_values(path)
    return bool(values['PLUGGY_CLIENT_ID'] and values['PLUGGY_CLIENT_SECRET'])

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):
        raise SafeError('provider_auth_redirect_rejected')

def authenticate(values,opener=None):
    identifier,secret=values['PLUGGY_CLIENT_ID'],values['PLUGGY_CLIENT_SECRET']
    if not identifier or not secret:raise SafeError('provider_auth_credentials_missing')
    request=urllib.request.Request('https://api.pluggy.ai/auth',method='POST',headers={'Content-Type':'application/json','Accept':'application/json','Cache-Control':'no-store'},data=json.dumps({'clientId':identifier,'clientSecret':secret}).encode())
    client=opener if opener is not None else urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    try:
        with client.open(request,timeout=20) as response:
            if response.status!=200:raise SafeError('provider_auth_http_'+str(response.status))
            raw=response.read(4097)
            if len(raw)>4096:raise SafeError('provider_auth_response_rejected')
            value=json.loads(raw)
            if not isinstance(value,dict) or set(value)!={'apiKey'} or not isinstance(value['apiKey'],str) or not re.fullmatch(r'[A-Za-z0-9._~-]{16,4000}',value['apiKey']):raise SafeError('provider_auth_response_rejected')
            value.clear()
    except urllib.error.HTTPError as error:
        code=error.code;error.close();raise SafeError('provider_auth_http_'+str(code)) from None
    except (urllib.error.URLError,TimeoutError,ValueError,UnicodeError):raise SafeError('provider_auth_unavailable') from None
    return {'credentials_authenticated':True,'provider_calls':1,'financial_reads':0}

def execute(operation):
    if operation not in ('init','check','authenticate'):raise SafeError('provider_profile_operation_invalid')
    path=directory();created=False
    if operation=='init':
        try:fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
        except FileExistsError:pass
        except OSError:raise SafeError('provider_profile_path_rejected') from None
        else:
            with os.fdopen(fd,'w') as output:output.write(TEMPLATE)
            created=True
    configured=read_profile(path)
    if operation=='authenticate':return authenticate(_profile_values(path))
    return {'profile_ready':True,'created':created,'credentials_configured':configured,'provider_calls':0,'path':str(path)}

if __name__=='__main__':
    try:
        if len(sys.argv)!=2:raise SafeError('provider_profile_operation_invalid')
        print(json.dumps(execute(sys.argv[1])))
    except (SafeError,OSError) as error:
        print(json.dumps({'error':str(error) if isinstance(error,SafeError) else 'provider_profile_operation_failed'}))
        raise SystemExit(1)
