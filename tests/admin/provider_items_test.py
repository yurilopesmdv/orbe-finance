import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('provider_items', Path(__file__).resolve().parents[2] / 'scripts/provider-items.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
A = '11111111-1111-4111-8111-111111111111'
B = '22222222-2222-4222-8222-222222222222'

class ItemsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old = module.PRIVATE_DIR
        module.PRIVATE_DIR = Path(self.temp.name) / 'private'
    def tearDown(self):
        module.PRIVATE_DIR = self.old
        self.temp.cleanup()
    def payload(self, a=A, b=None):
        items = [{'institution': 'mercado-pago', 'itemId': a}]
        if b is not None: items.append({'institution': 'bradesco', 'itemId': b})
        return json.dumps({'version': 2, 'items': items}).encode()
    def file(self):
        module.execute('init')
        return module.PRIVATE_DIR / 'pluggy-items.json'
    def test_init_never_overwrites_and_output_has_no_ids(self):
        path = self.file()
        path.write_bytes(self.payload())
        result = module.execute('init')
        self.assertEqual(result['configured_items'], 1)
        self.assertFalse(result['created'])
        self.assertTrue(result['complete'])
        self.assertEqual(result['provider_calls'], 0)
        self.assertNotIn(A, json.dumps(result))
        self.assertEqual(path.read_bytes(), self.payload())
    def test_empty_and_partial_are_incomplete(self):
        self.assertFalse(module.execute('init')['complete'])
        self.assertEqual(module.validate(self.payload(A, '')), (1, 2, 1))
    def test_duplicate_ids_rejected(self):
        with self.assertRaises(module.SafeError): module.validate(self.payload(A, A))
    def test_ambiguous_or_extra_json_rejected(self):
        for raw in [b'{"version":1,"version":1,"items":{}}', b'{"version":true,"items":{}}', b'[]', self.payload().replace(b'"version": 2', b'"extra": 1, "version": 2'), b'[' * 2000]:
            with self.assertRaises(module.SafeError): module.validate(raw)
    def test_malformed_identifier_rejected(self):
        for value in ['not-an-id', A.replace('-', ''), '00000000-0000-0000-0000-000000000000', 42]:
            with self.assertRaises(module.SafeError): module.validate(self.payload(value, B))
    def test_unknown_does_not_claim_bank_identity(self):
        path = self.file()
        value = {'version': 2, 'items': [{'institution': 'unknown', 'itemId': A}]}
        path.write_text(json.dumps(value))
        result = module.execute('check')
        self.assertTrue(result['complete'])
        self.assertEqual(result['identified_items'], 0)
    def test_two_distinct_items_supported(self):
        self.assertEqual(module.validate(self.payload(A, B)), (2, 2, 2))
    def test_limits_and_duplicate_bank_rejected(self):
        for items in [[], [{'institution': 'unknown', 'itemId': ''}] * 6, [{'institution': 'bradesco', 'itemId': ''}] * 2]:
            with self.assertRaises(module.SafeError): module.validate(json.dumps({'version': 2, 'items': items}).encode())
    def test_empty_legacy_migrated_but_filled_legacy_preserved(self):
        path = self.file()
        path.write_text(json.dumps(module.LEGACY_EMPTY))
        self.assertFalse(module.execute('init')['complete'])
        legacy = {'version': 1, 'items': {'bradesco': A, 'mercado-pago': ''}}
        raw = json.dumps(legacy)
        path.write_text(raw)
        with self.assertRaises(module.SafeError): module.execute('init')
        self.assertEqual(path.read_text(), raw)
    def test_permissions_and_hardlink_rejected(self):
        path = self.file()
        path.chmod(0o644)
        with self.assertRaises(module.SafeError): module.execute('check')
        path.chmod(0o600)
        os.link(path, path.parent / 'copy')
        with self.assertRaises(module.SafeError): module.execute('check')
    def test_symlink_rejected(self):
        path = self.file()
        other = path.parent / 'target'
        path.rename(other)
        path.symlink_to(other)
        with self.assertRaises(OSError): module.execute('check')
    def test_size_limit(self):
        path = self.file()
        path.write_bytes(b' ' * 4097)
        with self.assertRaises(module.SafeError): module.execute('check')
    def test_directory_permissions_rejected(self):
        self.file()
        module.PRIVATE_DIR.chmod(0o755)
        with self.assertRaises(module.SafeError): module.execute('check')

if __name__ == '__main__': unittest.main()
