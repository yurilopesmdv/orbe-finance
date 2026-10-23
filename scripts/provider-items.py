#!/usr/bin/env python3
"""Offline private proxy-item inventory; never prints identifiers or uses network."""
import json
import os
from pathlib import Path
import stat
import sys
import uuid

PRIVATE_DIR = Path.home() / '.config/orbe-finance'
BANKS = ('bradesco', 'mercado-pago', 'nubank', 'unknown')
TEMPLATE = {'version': 2, 'items': [{'institution': 'unknown', 'itemId': ''}]}
LEGACY_EMPTY = {'version': 1, 'items': {'bradesco': '', 'mercado-pago': ''}}

class SafeError(Exception):
    pass

def pairs(entries):
    result = {}
    for key, value in entries:
        if key in result:
            raise SafeError('provider_items_invalid')
        result[key] = value
    return result

def validate(raw):
    try:
        value = json.loads(raw.decode('utf-8', 'strict'), object_pairs_hook=pairs)
    except (ValueError, UnicodeError, RecursionError):
        raise SafeError('provider_items_invalid') from None
    if not isinstance(value, dict) or set(value) != {'version', 'items'} or type(value['version']) is not int or value['version'] != 2:
        raise SafeError('provider_items_invalid')
    items = value['items']
    if not isinstance(items, list) or not 1 <= len(items) <= 5:
        raise SafeError('provider_items_invalid')
    configured = []
    institutions = []
    identified = 0
    for item in items:
        if not isinstance(item, dict) or set(item) != {'institution', 'itemId'} or not isinstance(item['institution'], str) or item['institution'] not in BANKS:
            raise SafeError('provider_items_invalid')
        institution, identifier = item['institution'], item['itemId']
        if institution != 'unknown':
            if institution in institutions:
                raise SafeError('provider_items_ambiguous')
            institutions.append(institution)
        if not isinstance(identifier, str):
            raise SafeError('provider_items_invalid')
        if identifier == '':
            continue
        try:
            parsed = uuid.UUID(identifier)
        except (ValueError, AttributeError):
            raise SafeError('provider_items_invalid') from None
        if str(parsed) != identifier or parsed.int == 0 or parsed.version not in range(1, 9):
            raise SafeError('provider_items_invalid')
        configured.append(identifier)
        if institution != 'unknown':
            identified += 1
    if len(set(configured)) != len(configured):
        raise SafeError('provider_items_duplicate')
    return len(configured), len(items), identified

def _read(operation):
    if operation not in ('init', 'check'):
        raise SafeError('provider_items_operation_invalid')
    if any(p.is_symlink() for p in (PRIVATE_DIR, *PRIVATE_DIR.parents)):
        raise SafeError('provider_items_path_rejected')
    if operation == 'init':
        PRIVATE_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    info = PRIVATE_DIR.stat()
    if not stat.S_ISDIR(info.st_mode) or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o700:
        raise SafeError('provider_items_directory_rejected')
    path = PRIVATE_DIR / 'pluggy-items.json'
    created = False
    if operation == 'init':
        try:
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        except FileExistsError:
            pass
        else:
            with os.fdopen(fd, 'w') as output:
                json.dump(TEMPLATE, output, indent=2)
                output.write('\n')
            created = True
    fd = os.open(path, (os.O_RDWR if operation == 'init' else os.O_RDONLY) | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, 'r+b' if operation == 'init' else 'rb') as source:
        info = os.fstat(source.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_nlink != 1 or stat.S_IMODE(info.st_mode) != 0o600:
            raise SafeError('provider_items_file_rejected')
        raw = source.read(4097)
        if operation == 'init':
            try:
                legacy = json.loads(raw.decode('utf-8', 'strict'), object_pairs_hook=pairs)
            except (ValueError, UnicodeError, RecursionError):
                legacy = None
            if legacy == LEGACY_EMPTY:
                raw = (json.dumps(TEMPLATE, indent=2) + '\n').encode()
                source.seek(0)
                source.write(raw)
                source.truncate()
    if len(raw) > 4096:
        raise SafeError('provider_items_invalid')
    validate(raw)
    return created, raw

def load_items():
    _, raw = _read('check')
    return json.loads(raw)['items']

def execute(operation):
    created, raw = _read(operation)
    count, total, identified = validate(raw)
    return {'inventory_ready': True, 'created': created, 'configured_items': count, 'complete': count == total, 'identified_items': identified, 'provider_calls': 0}

if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise SafeError('provider_items_operation_invalid')
        print(json.dumps(execute(sys.argv[1])))
    except (SafeError, OSError):
        print(json.dumps({'error': 'provider_items_check_failed'}))
        raise SystemExit(1)
