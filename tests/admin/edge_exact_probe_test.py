import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch,Mock
spec=importlib.util.spec_from_file_location('probe',Path(__file__).resolve().parents[2]/'scripts/edge-exact-probe.py')
probe=importlib.util.module_from_spec(spec);spec.loader.exec_module(probe)
class ProbeGuards(unittest.TestCase):
    def test_stage_copies_only_fixed_decoder_and_entry(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);digest=probe.stage(root)
            paths={p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
            self.assertEqual(paths,{'supabase/config.toml','supabase/functions/_shared/exact-json.ts','supabase/functions/orbe-runtime-probe/index.mjs'})
            self.assertEqual(digest,hashlib.sha256((probe.ROOT/'supabase/functions/_shared/exact-json.ts').read_bytes()).hexdigest())
            self.assertEqual((root/'supabase/functions/orbe-runtime-probe/index.mjs').read_text(),probe.ENTRY)
            self.assertNotIn('Deno.env',probe.ENTRY)
            self.assertNotIn('fetch(',probe.ENTRY)
    def test_other_project_rejected_before_network(self):
        with patch.object(probe.admin,'config',return_value=('invented','a'*20)),patch.object(probe.admin,'client') as client:
            with self.assertRaisesRegex(probe.admin.SafeError,'probe_project_mismatch'):probe.main()
            client.assert_not_called()
    def test_preexisting_function_never_overwritten(self):
        request=Mock(return_value=[{'slug':probe.SLUG}])
        with patch.object(probe.admin,'config',return_value=('invented',probe.REF)),patch.object(probe.admin,'client',return_value=request),patch.object(probe.admin,'inspect'),patch.object(probe.subprocess,'run') as command:
            with self.assertRaisesRegex(probe.admin.SafeError,'probe_preexisting_function_rejected'):probe.main()
            command.assert_not_called()
    def test_ambiguous_remote_or_non_schema_rejected(self):
        for rows in [[{'slug':probe.SLUG},{'slug':probe.SLUG}],{},[None]]:
            with self.assertRaises(probe.admin.SafeError):probe.remote(lambda path:rows)
if __name__=='__main__':unittest.main()
