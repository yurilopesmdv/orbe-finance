import contextlib
import importlib.util
import io
import json
import shutil
import subprocess
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('preflight', Path(__file__).resolve().parents[2] / 'scripts/publish-preflight.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class PublicationScanTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.dist = self.root / 'dist'
        self.dist.mkdir()
        self.asset = self.dist / 'bundle.hbc'
        self.asset.write_bytes(b'\x00invented export\xff')
        self.private = {'SUPABASE_ACCESS_TOKEN': 'invented_admin_token',
                        'ORBE_OWNER_USER_ID': 'invented_owner_uuid', 'EXPO_TOKEN': 'invented_expo_token',
                        'PLUGGY_CLIENT_ID': 'invented_client_id', 'PLUGGY_CLIENT_SECRET': 'invented_client_secret',
                        'ORBE_MOVEMENT_IDENTITY_KEY':'12'*32,'ORBE_MOVEMENT_CURSOR_KEY':'34'*32,
                        'PRIVATE_ITEM_0': 'invented_item_uuid', 'SUPABASE_PROJECT_REF': 'public_project_ref'}

    def test_each_private_profile_canary_blocks_binary_export(self):
        for key, value in self.private.items():
            if key == 'SUPABASE_PROJECT_REF':
                continue
            with self.subTest(key=key):
                self.asset.write_bytes(b'\x00\xff' + value.encode() + b'\x01')
                with self.assertRaisesRegex(m.bridge.admin.SafeError, '^publish_private_content_rejected$'):
                    m.scan_artifacts(self.dist, self.private)

    def test_actual_movement_profile_canaries_block_binary_export_offline(self):
        profile=self.root/'movement-keys.env';profile.write_text('ORBE_MOVEMENT_IDENTITY_KEY='+('12'*32)+'\nORBE_MOVEMENT_CURSOR_KEY='+('34'*32)+'\n');profile.chmod(0o600)
        private=m.bridge.private_canaries(self.root,{})
        for key,value in private.items():
            with self.subTest(key=key):
                self.asset.write_bytes(b'\x00'+value.encode()+b'\xff')
                with self.assertRaisesRegex(m.bridge.admin.SafeError,'publish_private_content_rejected'):m.scan_artifacts(self.dist,private)

    def test_secret_split_across_read_boundary_is_detected(self):
        self.asset.write_bytes(b'x' * (32768 - 5) + self.private['PLUGGY_CLIENT_SECRET'].encode())
        with self.assertRaisesRegex(m.bridge.admin.SafeError, '^publish_private_content_rejected$'):
            m.scan_artifacts(self.dist, self.private)

    def test_public_project_ref_and_empty_optional_values_do_not_block(self):
        self.asset.write_bytes(b'public_project_ref')
        self.assertEqual(m.scan_artifacts(self.dist, {**self.private, 'PRIVATE_ITEM_1': ''}), 1)

    def test_symlink_file_and_directory_are_rejected(self):
        for target in (self.asset, self.dist):
            link = self.dist / 'link'
            link.symlink_to(target)
            with self.assertRaisesRegex(m.bridge.admin.SafeError, '^publish_artifact_rejected$'):
                m.scan_artifacts(self.dist, self.private)
            link.unlink()

    def test_hardlink_and_fifo_are_rejected_without_blocking(self):
        link = self.dist / 'hardlink'
        os.link(self.asset, link)
        with self.assertRaisesRegex(m.bridge.admin.SafeError, '^publish_artifact_rejected$'):
            m.scan_artifacts(self.dist, self.private)
        link.unlink()
        fifo = self.dist / 'fifo'
        os.mkfifo(fifo)
        with self.assertRaisesRegex(m.bridge.admin.SafeError, '^publish_artifact_rejected$'):
            m.scan_artifacts(self.dist, self.private)

    def test_missing_empty_export_and_empty_canaries_fail_closed(self):
        for folder, private in ((self.root / 'missing', self.private), (self.dist, {})):
            with self.assertRaises(m.bridge.admin.SafeError):
                m.scan_artifacts(folder, private)
        self.asset.unlink()
        with self.assertRaisesRegex(m.bridge.admin.SafeError, '^publish_export_required$'):
            m.scan_artifacts(self.dist, self.private)

    def test_main_uses_shared_profile_parser_offline_and_redacts_output(self):
        output = io.StringIO()
        with patch.object(m.bridge.admin, 'private_values', return_value={'SUPABASE_ACCESS_TOKEN': 'invented_admin_token'}) as base, \
             patch.object(m.bridge, 'private_canaries', return_value=self.private) as profiles, \
             patch.object(m.bridge.admin, 'client', side_effect=AssertionError('network forbidden')), \
             contextlib.redirect_stdout(output):
            m.main(self.root)
        base.assert_called_once()
        profiles.assert_called_once_with(m.bridge.admin.PRIVATE_CONFIG.parent, base.return_value)
        self.assertIn('"network_calls": 0', output.getvalue())
        for value in self.private.values():
            self.assertNotIn(value, output.getvalue())
        self.assertNotIn(str(self.root), output.getvalue())

    def test_invalid_private_profile_stops_before_artifact_scan(self):
        with patch.object(m.bridge.admin, 'private_values', side_effect=m.bridge.admin.SafeError('invalid_private_config')), \
             patch.object(m, 'scan_artifacts', side_effect=AssertionError('scan must not run')):
            with self.assertRaisesRegex(m.bridge.admin.SafeError, '^invalid_private_config$'):
                m.main(self.root)


class PublisherBoundaryTests(unittest.TestCase):
    def test_real_wrapper_blocks_private_export_before_authenticated_cli(self):
        self.run_wrapper(leak=True)

    def test_real_wrapper_allows_clean_export_to_invented_offline_cli(self):
        self.run_wrapper(leak=False)

    def run_wrapper(self, leak):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            root, home = base / 'project', base / 'home'
            scripts = root / 'scripts'
            scripts.mkdir(parents=True)
            for name in ['owner-release-guard.mjs', 'eas-safe.mjs', 'eas-environment.mjs', 'expo-environment.mjs',
                         'publish-preflight.py', 'bridge-deploy.py', 'backend-admin.py']:
                shutil.copyfile(m.ROOT / 'scripts' / name, scripts / name)
            profiles = home / '.config/orbe-finance'
            profiles.mkdir(parents=True, mode=0o700)
            for name, content in {
                'backend.env': 'SUPABASE_ACCESS_TOKEN=invented_admin_token\nSUPABASE_PROJECT_REF=' + 'a'*20 + '\nORBE_OWNER_USER_ID=invented_owner_uuid\n',
                'expo-publish.env': 'EXPO_TOKEN=invented_expo_token\n',
                'pluggy.env': 'PLUGGY_CLIENT_ID=invented_client_id\nPLUGGY_CLIENT_SECRET=invented_client_secret\n',
            }.items():
                file = profiles / name
                file.write_text(content)
                file.chmod(0o600)
            (root / '.env.backend.local').write_text('ORBE_BACKEND_ENV_FILE=' + str(profiles / 'backend.env') + '\n')
            project = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
            (root / 'app.json').write_text(json.dumps({'expo': {
                'scheme': 'orbe', 'slug': 'orbe-finance', 'sdkVersion': '57.0.0',
                'runtimeVersion': {'policy': 'sdkVersion'},
                'extra': {'liveIntegrationEnabled': False, 'eas': {'projectId': project}},
                'updates': {'url': 'https://u.expo.dev/' + project}}}))
            (profiles / 'eas-init-receipt.json').write_text(json.dumps({'projectId': project, 'slug': 'orbe-finance'}))
            updates = root / 'node_modules/expo-updates'
            updates.mkdir(parents=True)
            (updates / 'package.json').write_text('{"version":"57.0.26"}')
            dist = root / 'dist'
            dist.mkdir()
            (dist / 'metadata.json').write_text('{}')
            (dist / 'bundle.hbc').write_bytes(b'\x00' + (b'invented_client_secret' if leak else b'clean export'))
            binary = base / 'bin'
            binary.mkdir()
            marker = base / 'cli_was_started'
            npm = binary / 'npm'
            npm.write_text('#!/usr/bin/python3\nfrom pathlib import Path\nimport os\nassert os.environ.get("EXPO_TOKEN") == "invented_expo_token"\nPath(' + repr(str(marker)) + ').write_text("started")\nprint("[]")\n')
            npm.chmod(0o700)
            environment = {'HOME': str(home), 'PATH': str(binary) + os.pathsep + os.environ['PATH'],
                           'PYTHONDONTWRITEBYTECODE': '1'}
            result = subprocess.run([shutil.which('node'), str(scripts / 'eas-safe.mjs'), 'publish'],
                                    cwd=root, env=environment, capture_output=True, text=True, timeout=20)
            self.assertEqual(marker.exists(), not leak)
            self.assertEqual(result.returncode, 1 if leak else 0)
            if leak:
                self.assertEqual(result.stderr.strip(), 'Orbe: eas_private_preflight_failed')
            for value in ['invented_client_secret', 'invented_expo_token', 'invented_admin_token', str(home)]:
                self.assertNotIn(value, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
