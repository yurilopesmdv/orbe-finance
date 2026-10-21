#!/usr/bin/env python3
"""Create once or validate private server keys. Never print key material."""
import importlib.util
import json
import os
from pathlib import Path
import secrets
import stat
import sys
ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('movement_key_bridge',ROOT/'scripts/bridge-deploy.py')
bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)
NAMES=('ORBE_MOVEMENT_IDENTITY_KEY','ORBE_MOVEMENT_CURSOR_KEY')
class SafeError(Exception):pass

def read_keys(directory):
    directory=Path(directory)
    if any(p.is_symlink() for p in (directory,*directory.parents)):raise SafeError('movement_keys_path_invalid')
    info=directory.stat()
    if not stat.S_ISDIR(info.st_mode) or info.st_uid!=os.getuid() or stat.S_IMODE(info.st_mode)!=0o700:raise SafeError('movement_keys_directory_invalid')
    values=bridge.private_canaries(directory,{})
    if any(name not in values for name in NAMES):raise SafeError('movement_keys_missing')
    return {name:values[name] for name in NAMES}

def execute(operation,directory=None):
    if operation not in ('init','check'):raise SafeError('movement_keys_operation_invalid')
    directory=Path(directory) if directory is not None else bridge.admin.PRIVATE_CONFIG.parent
    if any(p.is_symlink() for p in (directory,*directory.parents)):raise SafeError('movement_keys_path_invalid')
    info=directory.stat()
    if not stat.S_ISDIR(info.st_mode) or info.st_uid!=os.getuid() or stat.S_IMODE(info.st_mode)!=0o700:raise SafeError('movement_keys_directory_invalid')
    path=directory/'movement-keys.env';created=False
    if operation=='init':
        # Validate every existing private profile before introducing more material.
        bridge.private_canaries(directory,{})
        first=secrets.token_hex(32);second=secrets.token_hex(32)
        if first==second or set(first)=={'0'} or set(second)=={'0'}:raise SafeError('movement_keys_generation_failed')
        try:fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
        except FileExistsError:pass
        else:
            with os.fdopen(fd,'w') as output:
                os.fchmod(output.fileno(),0o600)
                output.write(f'{NAMES[0]}={first}\n{NAMES[1]}={second}\n');output.flush();os.fsync(output.fileno())
            created=True
    read_keys(directory)
    return {'movement_keys_ready':True,'created':created,'financial_reads':0,'network_calls':0}

if __name__=='__main__':
    try:
        if len(sys.argv)!=2:raise SafeError('movement_keys_operation_invalid')
        print(json.dumps(execute(sys.argv[1])))
    except Exception:
        print(json.dumps({'error':'movement_keys_preparation_failed','financial_reads':0}));raise SystemExit(1)
