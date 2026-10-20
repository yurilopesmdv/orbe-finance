import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('staging', Path(__file__).resolve().parents[2] / 'scripts/stage-provider-items.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
A = '11111111-1111-4111-8111-111111111111'
B = '22222222-2222-4222-8222-222222222222'
OWNER = '33333333-3333-4333-8333-333333333333'
KEY = 'sb_secret_invented'
ITEMS = [{'institution': 'mercado-pago', 'itemId': A}]
class StagingTests(unittest.TestCase):
    def test_fixed_rpc_and_redacted_result(self):
        calls = []
        result = m.stage(ITEMS, OWNER, KEY, lambda request: calls.append(request) or True)
        self.assertEqual(result, {'pending_connections_staged': 1, 'provider_calls': 0, 'financial_reads': 0})
        self.assertEqual(calls[0].full_url, m.URL)
        self.assertNotIn(A, calls[0].full_url)
        self.assertEqual(calls[0].get_method(), 'POST')
        self.assertEqual(json.loads(calls[0].data), {'p_owner_id': OWNER, 'p_institution': 'mercado-pago', 'p_item_id': A})
        self.assertNotIn(A, json.dumps(result))
        self.assertNotIn(KEY, json.dumps(result))
    def test_check_is_offline_and_does_not_load_admin_configuration(self):
        with patch.object(m.inventory, 'load_items', return_value=ITEMS), patch.object(m.admin, 'config', side_effect=AssertionError('must not read')), patch.object(m, 'send', side_effect=AssertionError('must not call')):
            self.assertTrue(m.execute('check')['ready_to_stage'])
    def test_unknown_or_partial_rejected_before_transport(self):
        for items in [[{'institution': 'unknown', 'itemId': A}], [*ITEMS, {'institution': 'bradesco', 'itemId': ''}]]:
            with self.assertRaises(m.SafeError): m.stage(items, OWNER, KEY, lambda request: self.fail('network'))
    def test_invalid_owner_or_key_rejected_before_transport(self):
        for owner, key in [('bad', KEY), (OWNER, 'bad'), ('00000000-0000-0000-0000-000000000000', KEY)]:
            with self.assertRaises(m.SafeError): m.stage(ITEMS, owner, key, lambda request: self.fail('network'))
    def test_failure_stops_without_retry_or_reactivation(self):
        calls = []
        with self.assertRaises(m.SafeError): m.stage([*ITEMS, {'institution': 'bradesco', 'itemId': B}], OWNER, KEY, lambda request: calls.append(request) or False)
        self.assertEqual(len(calls), 1)
    def test_foreign_project_rejected_before_api(self):
        with patch.object(m.inventory, 'load_items', return_value=ITEMS), patch.object(m.admin, 'config', return_value=('invented', 'a' * 20)), patch.object(m.admin, 'client', side_effect=AssertionError('network')):
            with self.assertRaises(m.SafeError): m.execute('stage')
    def test_management_path_only_allows_literal_reveal_query(self):
        request = m.admin.client('invented', m.REF)
        for path in ['/api-keys?reveal=false', '/api-keys?reveal=true&extra=1', '/database/query?reveal=true']:
            with self.assertRaises(m.admin.SafeError): request(path)
    def test_response_bound_and_true_required(self):
        class Response:
            status = 200
            def __init__(self, raw): self.raw = raw
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self, limit): return self.raw[:limit]
        class Opener:
            def __init__(self, raw): self.raw = raw
            def open(self, request, timeout): return Response(self.raw)
        for raw in [b'false', b'{}', b'1', b' ' * 33]:
            with patch.object(m.urllib.request, 'build_opener', return_value=Opener(raw)):
                with self.assertRaises((m.SafeError, ValueError)): m.send(None)
        with patch.object(m.urllib.request, 'build_opener', return_value=Opener(b'true')):
            self.assertTrue(m.send(None))
if __name__ == '__main__': unittest.main()
