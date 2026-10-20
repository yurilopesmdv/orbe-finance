import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('metadata_deploy', Path(__file__).resolve().parents[2] / 'scripts/metadata-deploy.py')
deploy = importlib.util.module_from_spec(spec); spec.loader.exec_module(deploy)
REF = 'a' * 20
CURRENT = {'slug':'orbe-metadata','id':'invented-id','version':2,'status':'ACTIVE','verify_jwt':False}

class MetadataDeployTests(unittest.TestCase):
    def test_public_configuration_rejects_other_project_secret_and_extra_keys(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); path = root / '.env.local'
            valid = 'EXPO_PUBLIC_SUPABASE_URL=https://' + REF + '.supabase.co\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_invented\n'
            path.write_text(valid); self.assertEqual(deploy.public_config(root,REF),'sb_publishable_invented')
            for invalid in [valid.replace(REF,'b'*20), valid.replace('sb_publishable_invented','sb_secret_invented'),valid+'SUPABASE_ACCESS_TOKEN=invented\n']:
                path.write_text(invalid)
                with self.assertRaises(deploy.admin.SafeError): deploy.public_config(root,REF)

    def test_only_exact_dedicated_function_configuration_is_accepted(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); path = root / 'supabase/config.toml'; path.parent.mkdir()
            valid = '[functions.orbe-metadata]\nverify_jwt=false\nentrypoint="./functions/orbe-metadata/index.mjs"\n'
            path.write_text(valid); deploy.validate_function_config(root)
            for invalid in [valid.replace('false','true'), valid.replace('orbe-metadata/index','orbe-bridge/index'),valid+'import_map="private.json"\n']:
                path.write_text(invalid)
                with self.assertRaises(deploy.admin.SafeError): deploy.validate_function_config(root)

    def test_remote_schema_and_duplicate_slug_are_rejected(self):
        self.assertIsNone(deploy.remote(lambda _: [{'slug':'orbe-bridge'}]))
        for rows in [{},[None],[CURRENT,CURRENT]]:
            with self.assertRaises(deploy.admin.SafeError): deploy.remote(lambda _: rows)

    def test_unmanaged_remote_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(deploy.admin.SafeError,'unmanaged'):
                deploy.preflight(CURRENT,Path(folder)/'manifest.json',REF)

    def test_drift_and_missing_remote_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'manifest.json'; path.write_text(json.dumps({'project_ref':REF,'id':'invented-id','version':1}))
            with self.assertRaisesRegex(deploy.admin.SafeError,'drift'): deploy.preflight(CURRENT,path,REF)
            with self.assertRaisesRegex(deploy.admin.SafeError,'missing'): deploy.preflight(None,path,REF)
            path.write_text(json.dumps({'project_ref':REF, 'id':'invented-id','version':2})); deploy.preflight(CURRENT,path,REF)

    def test_manifest_symlink_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'manifest.json'; path.symlink_to(Path(folder)/'outside')
            with self.assertRaisesRegex(deploy.admin.SafeError,'private_path'): deploy.preflight(None,path,REF)

    def fixture(self, folder, operation='deploy-metadata'):
        root = Path(folder); private = root/'backend.env'
        patches = [patch.object(deploy,'ROOT',root),patch.object(deploy.admin,'PRIVATE_CONFIG',private),patch.object(deploy.admin,'config',return_value=('invented-pat',REF)),patch.object(deploy.admin,'client'),patch.object(deploy.admin,'inspect'),patch.object(deploy.admin,'private_values',return_value={}),patch.object(deploy.bridge,'artifacts',return_value={'synthetic':'hash'}),patch.object(deploy,'validate_function_config'),patch.object(deploy,'public_config',return_value='sb_publishable_invented'),patch.object(deploy.sys,'argv',['metadata',operation]),contextlib.redirect_stdout(io.StringIO())]
        stack = contextlib.ExitStack()
        for item in patches: stack.enter_context(item)
        return stack

    def test_unmanaged_remote_stops_before_any_configuration_or_deploy(self):
        with tempfile.TemporaryDirectory() as folder, self.fixture(folder), patch.object(deploy,'remote',return_value=CURRENT), patch.object(deploy.subprocess,'run') as run:
            with self.assertRaisesRegex(deploy.admin.SafeError,'unmanaged'): deploy.main()
            run.assert_not_called()

    def test_deploy_only_expected_slug_public_configuration_and_separate_manifest(self):
        with tempfile.TemporaryDirectory() as folder, self.fixture(folder), patch.object(deploy,'remote',side_effect=[None,{**CURRENT,'version':1},CURRENT]), patch.object(deploy,'smoke') as smoke:
            calls=[]; configurations=[]
            def run(arguments, **options):
                calls.append(arguments)
                self.assertEqual(options['env']['SUPABASE_ACCESS_TOKEN'],'invented-pat')
                self.assertNotIn('NODE_OPTIONS',options['env'])
                self.assertNotIn('invented-pat',' '.join(arguments))
                if 'secrets' in arguments:
                    path=Path(arguments[arguments.index('--env-file')+1]); configurations.append(path.read_text()); self.assertEqual(path.stat().st_mode & 0o777,0o600)
                return type('Result',(),{'returncode':0})()
            with patch.object(deploy.subprocess,'run',side_effect=run): deploy.main()
            self.assertEqual(len(calls),4)
            self.assertIn('ORBE_METADATA_ENABLED=false',configurations[0]); self.assertIn('ORBE_METADATA_ENABLED=true',configurations[1])
            self.assertTrue(all(set(line.split('=',1)[0] for line in body.splitlines()) == {'ORBE_METADATA_ENABLED','ORBE_PUBLISHABLE_KEY'} for body in configurations))
            for call in [calls[1],calls[3]]: self.assertEqual(call[call.index('deploy')+1],'orbe-metadata'); self.assertNotIn('orbe-bridge',call)
            path=Path(folder)/'metadata-deploy.json'; self.assertEqual(json.loads(path.read_text())['version'],2); self.assertEqual(path.stat().st_mode & 0o777,0o600)
            self.assertFalse((Path(folder)/'metadata-runtime.env').exists()); self.assertFalse((Path(folder)/'bridge-deploy.json').exists())
            smoke.assert_called_once_with(REF)

    def test_failed_cli_attempts_disable_and_removes_temporary_config(self):
        with tempfile.TemporaryDirectory() as folder, self.fixture(folder), patch.object(deploy,'remote',return_value=None), patch.object(deploy.subprocess,'run',return_value=type('Result',(),{'returncode':1})()) as run:
            with self.assertRaisesRegex(deploy.admin.SafeError,'cli_failed'): deploy.main()
            self.assertEqual(run.call_count,2); self.assertFalse((Path(folder)/'metadata-runtime.env').exists())

    def test_smoke_does_not_mutate_configuration_or_deploy(self):
        with tempfile.TemporaryDirectory() as folder, self.fixture(folder,'smoke-metadata'), patch.object(deploy,'remote',return_value=CURRENT), patch.object(deploy,'smoke') as smoke, patch.object(deploy.subprocess,'run') as run:
            (Path(folder)/'metadata-deploy.json').write_text(json.dumps({'project_ref':REF,'id':'invented-id','version':2}))
            deploy.main(); run.assert_not_called(); smoke.assert_called_once_with(REF)

if __name__ == '__main__': unittest.main()
