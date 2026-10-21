#!/usr/bin/env python3
"""Offline, redacted scan of publication artifacts against configured private profiles."""
import importlib.util
import json
import os
from pathlib import Path
import stat
import sys

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('publish_bridge', ROOT / 'scripts/bridge-deploy.py')
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)


def scan_artifacts(directory, private):
    markers = [value.encode('utf-8') for key, value in private.items()
               if key != 'SUPABASE_PROJECT_REF' and isinstance(value, str) and value]
    if not markers or max(map(len, markers)) > 16384:
        raise bridge.admin.SafeError('publish_scan_config_rejected')
    if any(parent.is_symlink() for parent in (directory, *directory.parents)) or not directory.is_dir():
        raise bridge.admin.SafeError('publish_artifact_rejected')
    overlap = max(map(len, markers)) - 1
    count = 0
    for path in directory.rglob('*'):
        if path.is_symlink():
            raise bridge.admin.SafeError('publish_artifact_rejected')
        if path.is_dir():
            continue
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        with os.fdopen(fd, 'rb') as source:
            info = os.fstat(source.fileno())
            if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
                raise bridge.admin.SafeError('publish_artifact_rejected')
            tail = b''
            while True:
                chunk = source.read(32768)
                if not chunk:
                    break
                window = tail + chunk
                if any(marker in window for marker in markers):
                    raise bridge.admin.SafeError('publish_private_content_rejected')
                tail = window[-overlap:] if overlap else b''
        count += 1
    if not count:
        raise bridge.admin.SafeError('publish_export_required')
    return count


def main(root=ROOT):
    private = bridge.private_canaries(bridge.admin.PRIVATE_CONFIG.parent, bridge.admin.private_values())
    count = scan_artifacts(root / 'dist', private)
    print(json.dumps({'publication_private_scan_passed': True, 'artifact_count': count, 'network_calls': 0}))


if __name__ == '__main__':
    try:
        if len(sys.argv) != 1:
            raise bridge.admin.SafeError('publish_operation_rejected')
        main()
    except Exception:
        # Never include OS errors, filenames, profile contents or a traceback.
        print('Orbe: publication_private_scan_failed', file=sys.stderr)
        sys.exit(1)
