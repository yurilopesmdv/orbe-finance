import contextlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('bridge_deploy', Path(__file__).resolve().parents[2] / 'scripts/bridge-deploy.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)

@contextlib.contextmanager
def fixture():
    with tempfile.TemporaryDirectory() as folder:
        root = Path(folder) / 'project'; directory = root / 'supabase/functions'; directory.mkdir(parents=True)
        for name in deploy.ALLOWED:
            path = directory / name; path.parent.mkdir(exist_ok=True)
            path.write_text(deploy.EXPECTED_ENTRY if name == 'orbe-bridge/index.mjs' else deploy.EXPECTED_METADATA_ENTRY if name == 'orbe-metadata/index.mjs' else 'export const synthetic = true;\n')
        yield root, directory

class DisabledDeployGuards(unittest.TestCase):
    def test_only_expected_synthetic_sources_are_accepted(self):
        with fixture() as (root, directory):
            self.assertEqual(set(deploy.artifacts(root, {'SUPABASE_ACCESS_TOKEN': 'invented-secret'})), deploy.ALLOWED)

    def test_enabled_entrypoint_is_rejected(self):
        with fixture() as (root, directory):
            (directory / 'orbe-bridge/index.mjs').write_text(deploy.EXPECTED_ENTRY.replace('liveApproved: false', 'liveApproved: true'))
            with self.assertRaisesRegex(deploy.admin.SafeError, 'bridge_disabled_entrypoint_required'):
                deploy.artifacts(root, {})

    def test_modified_metadata_entrypoint_is_rejected(self):
        with fixture() as (root, directory):
            (directory / 'orbe-metadata/index.mjs').write_text(deploy.EXPECTED_METADATA_ENTRY + 'fetch("https://untrusted.invalid");\n')
            with self.assertRaisesRegex(deploy.admin.SafeError, 'bridge_metadata_entrypoint_invalid'):
                deploy.artifacts(root, {})

    def test_unknown_private_source_is_rejected(self):
        with fixture() as (root, directory):
            (directory / '.env').write_text('invented')
            with self.assertRaisesRegex(deploy.admin.SafeError, 'bridge_unknown_source_file'):
                deploy.artifacts(root, {})

    def test_source_symlink_is_rejected(self):
        with fixture() as (root, directory):
            path = directory / '_shared/bridge.ts'; path.unlink(); path.symlink_to(directory / '_shared/supabase-rest.ts')
            with self.assertRaisesRegex(deploy.admin.SafeError, 'bridge_source_symlink_rejected'):
                deploy.artifacts(root, {})

    def test_private_canary_cannot_enter_uploaded_source(self):
        with fixture() as (root, directory):
            (directory / '_shared/bridge.ts').write_text('invented-private-token')
            with self.assertRaisesRegex(deploy.admin.SafeError, 'bridge_private_content_rejected'):
                deploy.artifacts(root, {'SUPABASE_ACCESS_TOKEN': 'invented-private-token'})

    def test_supplier_and_item_canaries_rejected(self):
        for key in ['PLUGGY_CLIENT_ID','PLUGGY_CLIENT_SECRET','EXPO_TOKEN','PRIVATE_ITEM_0']:
            with fixture() as (root,directory):
                (directory/'_shared/bridge.ts').write_text('invented-private-canary')
                with self.assertRaisesRegex(deploy.admin.SafeError,'bridge_private_content_rejected'):
                    deploy.artifacts(root,{key:'invented-private-canary'})

    def test_private_canaries_collected_without_output(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder);profile=path/'pluggy.env';profile.write_text('PLUGGY_CLIENT_ID=invented-client\nPLUGGY_CLIENT_SECRET=invented-private-secret\n');profile.chmod(0o600)
            capture=io.StringIO()
            with contextlib.redirect_stdout(capture): values=deploy.private_canaries(path,{})
            self.assertEqual(capture.getvalue(),'')
            self.assertEqual(values['PLUGGY_CLIENT_SECRET'],'invented-private-secret')

    def test_private_canary_profile_permissions_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder);profile=path/'pluggy.env';profile.write_text('PLUGGY_CLIENT_ID=invented\nPLUGGY_CLIENT_SECRET=invented-secret\n');profile.chmod(0o644)
            with self.assertRaisesRegex(deploy.admin.SafeError,'bridge_private_profile_rejected'): deploy.private_canaries(path,{})

    def test_private_canary_profile_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder);target=path/'target';target.write_text('invented');(path/'pluggy.env').symlink_to(target)
            with self.assertRaises(OSError): deploy.private_canaries(path,{})

    def test_existing_unmanaged_function_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as folder:
            private = Path(folder) / 'backend.env'
            with patch.object(deploy.admin, 'config', return_value=('invented', 'a' * 20)), patch.object(deploy.admin, 'client'), patch.object(deploy.admin, 'inspect'), patch.object(deploy.admin, 'private_values', return_value={}), patch.object(deploy.admin, 'PRIVATE_CONFIG', private), patch.object(deploy, 'artifacts', return_value={}), patch.object(deploy, 'verify_remote', return_value={'id': 'invented-id', 'slug': 'orbe-bridge'}), patch.object(deploy.sys, 'argv', ['deploy', 'deploy-disabled']), patch.object(deploy.subprocess, 'run') as run, contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaisesRegex(deploy.admin.SafeError, 'bridge_unmanaged_function_rejected'):
                    deploy.main()
                run.assert_not_called()

if __name__ == '__main__': unittest.main()
