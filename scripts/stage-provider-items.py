#!/usr/bin/env python3
"""Stage pending metadata only. Never calls Pluggy or prints identifiers/credentials."""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parent.parent
REF = 'vvaufaoahotmaocrcyij'
URL = 'https://' + REF + '.supabase.co/rest/v1/rpc/orbe_stage_connection'
class SafeError(Exception):
    pass

def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value

inventory = module('private_items', 'provider-items.py')
admin = module('private_backend', 'backend-admin.py')

def validate(items):
    count, total, identified = inventory.validate(json.dumps({'version': 2, 'items': items}).encode())
    if count != total or identified != total:
        raise SafeError('staging_inventory_incomplete')
    return count

def send(request):
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs):
            raise SafeError('staging_redirect_rejected')
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    with opener.open(request, timeout=20) as response:
        if response.status != 200:
            raise SafeError('staging_failed')
        raw = response.read(33)
        if len(raw) > 32 or json.loads(raw) is not True:
            raise SafeError('staging_failed')
    return True

def stage(items, owner, key, transport):
    count = validate(items)
    try:
        parsed = uuid.UUID(owner)
    except (ValueError, TypeError, AttributeError):
        raise SafeError('staging_owner_invalid') from None
    if str(parsed) != owner or parsed.int == 0 or not isinstance(key, str) or not re.fullmatch(r'sb_secret_[A-Za-z0-9_-]{1,512}', key):
        raise SafeError('staging_configuration_invalid')
    for item in items:
        request = urllib.request.Request(URL, method='POST',
            headers={'apikey': key, 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cache-Control': 'no-store'},
            data=json.dumps({'p_owner_id': owner, 'p_institution': item['institution'], 'p_item_id': item['itemId']}).encode())
        if transport(request) is not True:
            raise SafeError('staging_failed')
    return {'pending_connections_staged': count, 'provider_calls': 0, 'financial_reads': 0}

def execute(operation):
    if operation not in ('check', 'stage'):
        raise SafeError('staging_operation_invalid')
    items = inventory.load_items()
    count = validate(items)
    if operation == 'check':
        return {'ready_to_stage': True, 'configured_items': count, 'provider_calls': 0, 'financial_reads': 0}
    token, ref = admin.config()
    if ref != REF:
        raise SafeError('staging_project_rejected')
    request = admin.client(token, ref)
    _, history, _ = admin.inspect(request)
    for path in sorted((ROOT / 'supabase/migrations').glob('*.sql')):
        name = 'orbe_' + path.stem + '_' + hashlib.sha256(path.read_bytes()).hexdigest()
        if not any(isinstance(row, dict) and row.get('name') == name for row in history):
            raise SafeError('staging_migrations_unverified')
    owner = admin.owner_id()
    keys = request('/api-keys?reveal=true')
    if not isinstance(keys, list):
        raise SafeError('staging_key_unavailable')
    candidates = [row.get('api_key') for row in keys if isinstance(row, dict) and row.get('type') == 'secret' and row.get('name') == 'default']
    if len(candidates) != 1:
        raise SafeError('staging_key_unavailable')
    return stage(items, owner, candidates[0], send)

if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise SafeError('staging_operation_invalid')
        print(json.dumps(execute(sys.argv[1])))
    except Exception:
        # No exception details: remote errors and configuration may carry identifiers.
        print(json.dumps({'error': 'private_staging_failed', 'financial_reads': 0}))
        raise SystemExit(1)
