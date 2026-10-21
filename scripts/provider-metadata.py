#!/usr/bin/env python3
"""Known-item technical readiness only. Never requests financial product endpoints."""
import importlib.util
import json
from pathlib import Path
import re
import sys
from datetime import datetime,timezone
import urllib.request
import urllib.error
ROOT=Path(__file__).resolve().parent.parent

def module(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
    value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
profile=module('metadata_profile','provider-profile.py')
inventory=module('metadata_inventory','stage-provider-items.py').inventory
class SafeError(Exception):pass

def instant(value):
    if not isinstance(value,str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})',value):raise SafeError('metadata_date_invalid')
    try:return datetime.fromisoformat(value.replace('Z','+00:00')).timestamp()
    except ValueError:raise SafeError('metadata_date_invalid') from None

def project_item(raw,item_id,now):
    if not isinstance(raw,dict) or raw.get('id')!=item_id or not isinstance(raw.get('connector'),dict) or raw['connector'].get('name')!='MeuPluggy' or raw['connector'].get('isSandbox') is not False:raise SafeError('metadata_item_invalid')
    expiry=instant(raw.get('consentExpiresAt'))
    products=raw.get('products')
    if not isinstance(products,list) or len(products)>32 or any(not isinstance(v,str) or not re.fullmatch(r'[A-Z_]{1,64}',v) for v in products):raise SafeError('metadata_products_invalid')
    return {'item_updated':raw.get('status')=='UPDATED' and raw.get('executionStatus')=='SUCCESS' and raw.get('error') is None,'proxy_consent_current':expiry>now,'accounts_requested':'ACCOUNTS' in products,'movements_requested':'TRANSACTIONS' in products,'investments_requested':'INVESTMENTS' in products}

def project_consents(raw,item_id,now):
    if not isinstance(raw,dict) or type(raw.get('page'))is not int or raw['page']!=1 or type(raw.get('total'))is not int or type(raw.get('totalPages'))is not int or not isinstance(raw.get('results'),list) or len(raw['results'])>100 or raw['total']!=len(raw['results']) or raw['totalPages'] not in ([0,1] if raw['total']==0 else [1]):raise SafeError('metadata_consents_invalid')
    active=[]
    for row in raw['results']:
        if not isinstance(row,dict) or row.get('itemId')!=item_id or not all(k in row for k in ('createdAt','products')):raise SafeError('metadata_consent_invalid')
        created=instant(row['createdAt']);expiry=None if row.get('expiresAt') is None else instant(row['expiresAt']);revoked=None if row.get('revokedAt') is None else instant(row['revokedAt'])
        if created>now+60 or not isinstance(row['products'],list) or len(row['products'])>32 or not all(isinstance(v,str) and re.fullmatch(r'[A-Z_]{1,64}',v) for v in row['products']):raise SafeError('metadata_consent_invalid')
        permissions=row.get('openFinancePermissionsGranted')
        if permissions is not None and (not isinstance(permissions,list) or len(permissions)>64 or not all(isinstance(v,str) and re.fullmatch(r'[A-Z_]{1,64}',v) for v in permissions)):raise SafeError('metadata_consent_invalid')
        if 'revokedAt' in row and revoked is None and (expiry is None or expiry>now):active.append((bool(permissions),expiry is not None))
    return {'active_consent_count':len(active),'unambiguous_active_consent':len(active)==1,'open_finance_permissions_present':len(active)==1 and active[0][0],'bank_expiry_proven':False}

def inspect_metadata(credentials,items,open_request=None,now=None):
    if not isinstance(items,list) or not 1<=len(items)<=5:raise SafeError('metadata_inventory_invalid')
    for item in items:
        if not isinstance(item,dict) or set(item)!={'institution','itemId'} or item['institution'] not in ('bradesco','mercado-pago') or not isinstance(item['itemId'],str) or not re.fullmatch(r'[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}',item['itemId']):raise SafeError('metadata_inventory_invalid')
    if len({row['itemId'] for row in items})!=len(items) or len({row['institution'] for row in items})!=len(items):raise SafeError('metadata_inventory_ambiguous')
    if set(credentials)!={'PLUGGY_CLIENT_ID','PLUGGY_CLIENT_SECRET'} or not re.fullmatch(r'[A-Za-z0-9_-]{1,256}',credentials['PLUGGY_CLIENT_ID']) or not re.fullmatch(r'[A-Za-z0-9._~/-]{16,512}',credentials['PLUGGY_CLIENT_SECRET']):raise SafeError('metadata_credentials_invalid')
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),profile.NoRedirect())
    request_fn=open_request or opener.open
    linked_ids=set()
    def call(path,body=None,key=None):
        allowed=path=='/auth' and body is not None and key is None or (any(path in ('/items/'+row['itemId'],'/consents?itemId='+row['itemId']) for row in items) or any(path=='/items/'+identifier for identifier in linked_ids)) and body is None and isinstance(key,str)
        if not allowed:raise SafeError('metadata_endpoint_denied')
        headers={'Accept':'application/json','Content-Type':'application/json','Cache-Control':'no-store'}
        if key:headers['X-API-KEY']=key
        req=urllib.request.Request('https://api.pluggy.ai'+path,method='POST' if body is not None else 'GET',headers=headers,data=json.dumps(body).encode() if body is not None else None)
        with request_fn(req,timeout=20) as response:
            if response.status!=200 or response.geturl()!=req.full_url or not re.fullmatch(r'application/json(?:\s*;.*)?',response.headers.get('Content-Type',''),re.I):raise SafeError('metadata_http_invalid')
            limit=4096 if path=='/auth' else 131072
            raw=response.read(limit+1)
            if len(raw)>limit:raise SafeError('metadata_json_excessive')
            try:return json.loads(raw.decode('utf-8','strict'))
            except (ValueError,UnicodeError,RecursionError):raise SafeError('metadata_json_invalid') from None
    auth=call('/auth',{'clientId':credentials['PLUGGY_CLIENT_ID'],'clientSecret':credentials['PLUGGY_CLIENT_SECRET']})
    if not isinstance(auth,dict) or set(auth)!={'apiKey'} or not isinstance(auth['apiKey'],str) or not re.fullmatch(r'[A-Za-z0-9._~-]{16,4000}',auth['apiKey']):raise SafeError('metadata_auth_invalid')
    key=auth.pop('apiKey');reports=[];now=now if now is not None else datetime.now(timezone.utc).timestamp()
    try:
        for row in items:
            identifier=row['itemId'];item=project_item(call('/items/'+identifier,key=key),identifier,now)
            consent_source=None
            try:
                consent_source=call('/consents?itemId='+identifier,key=key)
                consents=project_consents(consent_source,identifier,now)
            except urllib.error.HTTPError as error:
                error.close();consents={'consent_metadata_available':False}
            except SafeError:
                consents={'consent_metadata_available':True,'consent_schema_confirmed':False}
                if isinstance(consent_source,dict) and isinstance(consent_source.get('results'),list):
                    rows=consent_source['results']
                    consents['consent_rows_match_proxy']=all(isinstance(r,dict) and r.get('itemId')==identifier for r in rows)
                    consents['consent_required_fields_present']=all(isinstance(r,dict) and all(k in r for k in ('itemId','createdAt','products')) for r in rows)
                    consents['consent_permissions_field_present']=all(isinstance(r,dict) and 'openFinancePermissionsGranted'in r for r in rows)
            # Follow at most one UUID supplied by the consent endpoint scoped to this known proxy.
            # GETitem is metadata only; no returned URL, global enumeration or product request.
            if isinstance(consent_source,dict) and isinstance(consent_source.get('results'),list):
                candidates={entry.get('itemId') for entry in consent_source['results'] if isinstance(entry,dict) and isinstance(entry.get('itemId'),str)}
                if len(candidates)==1:
                    candidate=next(iter(candidates))
                    if candidate!=identifier and re.fullmatch(r'[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}',candidate):
                        linked_ids.add(candidate)
                        try:
                            linked=call('/items/'+candidate,key=key)
                            connector=linked.get('connector') if isinstance(linked,dict) else None
                            consents['linked_source_accessible']=isinstance(linked,dict) and linked.get('id')==candidate
                            consents['linked_source_ready']=isinstance(linked,dict) and linked.get('status')=='UPDATED' and linked.get('executionStatus')=='SUCCESS' and linked.get('error')is None
                            consents['linked_source_open_finance']=isinstance(connector,dict) and connector.get('isOpenFinance')is True and connector.get('isSandbox')is False
                            consents['linked_source_institution_matches']=isinstance(connector,dict) and connector.get('id')=={'bradesco':603,'mercado-pago':606}[row['institution']]
                            if consents['linked_source_accessible'] and consents['linked_source_open_finance'] and consents['linked_source_institution_matches']:
                                consents['linked_consent']=project_consents(consent_source,candidate,now)
                        except urllib.error.HTTPError as error:
                            error.close();consents['linked_source_accessible']=False
                        except SafeError:
                            consents['linked_source_schema_confirmed']=False
                        finally:linked_ids.discard(candidate)
            reports.append({'institution':row['institution'],**item,**consents})
        return {'technical_metadata_only':True,'connections':reports,'financial_reads':0}
    finally:key=None;auth.clear()

if __name__=='__main__':
    try:
        if len(sys.argv)!=2 or sys.argv[1]!='inspect-metadata':raise SafeError('metadata_operation_invalid')
        print(json.dumps(inspect_metadata(profile._profile_values(profile.directory()),inventory.load_items())))
    except Exception:
        print(json.dumps({'error':'technical_metadata_unavailable','financial_reads':0}));raise SystemExit(1)
