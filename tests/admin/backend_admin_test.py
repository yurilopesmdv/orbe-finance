import contextlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

spec = importlib.util.spec_from_file_location('backend_admin', Path(__file__).resolve().parents[2] / 'scripts/backend-admin.py')
admin = importlib.util.module_from_spec(spec)
spec.loader.exec_module(admin)

@contextlib.contextmanager
def public_configuration_fixture(keys):
    import hashlib
    from unittest.mock import Mock
    with tempfile.TemporaryDirectory() as folder:
        root = Path(folder); directory = root / 'supabase/migrations'; directory.mkdir(parents=True)
        baseline = directory / '20261016170000_bootstrap.sql'; baseline.write_text('select 1;')
        history = [{'name': 'orbe_' + baseline.stem + '_' + hashlib.sha256(baseline.read_bytes()).hexdigest()}]
        def request(path, method='GET', body=None):
            if path == '/api-keys': return keys
            if path == '/config/auth' and method == 'PATCH': raise admin.SafeError('management_http_400')
            raise AssertionError('unexpected administrative operation')
        with patch.object(admin, 'ROOT', root), patch.object(admin, 'config', return_value=('fake-admin-token', 'a' * 20)), patch.object(admin, 'client', return_value=Mock(side_effect=request)), patch.object(admin, 'inspect', return_value=(1, history, {})), patch.object(admin.sys, 'argv', ['admin', 'configure-client']), contextlib.redirect_stdout(io.StringIO()):
            yield root

class BackendGuards(unittest.TestCase):
    @contextlib.contextmanager
    def private_fixture(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder) / 'project'; root.mkdir()
            private = Path(folder) / 'private/backend.env'; private.parent.mkdir()
            private.write_text('SUPABASE_ACCESS_TOKEN=invented-token\nSUPABASE_PROJECT_REF=' + 'a' * 20 + '\nORBE_OWNER_USER_ID=00000000-0000-4000-8000-000000000001\n')
            (root / '.env.backend.local').write_text('ORBE_BACKEND_ENV_FILE=' + str(private) + '\n')
            with patch.object(admin, 'ROOT', root), patch.object(admin, 'PRIVATE_CONFIG', private):
                yield root, private

    def test_external_private_config_and_owner_preserved(self):
        with self.private_fixture() as (root, private):
            self.assertEqual(admin.config(), ('invented-token', 'a' * 20))
            self.assertEqual(admin.owner_id(), '00000000-0000-4000-8000-000000000001')
            self.assertEqual(private.stat().st_mode & 0o777, 0o600)
            self.assertEqual(private.parent.stat().st_mode & 0o777, 0o700)
            self.assertNotIn('invented-token', (root / '.env.backend.local').read_text())

    def test_pointer_mixed_with_secret_rejected(self):
        with self.private_fixture() as (root, private):
            with (root / '.env.backend.local').open('a') as file:
                file.write('SUPABASE_ACCESS_TOKEN=invented\n')
            with self.assertRaisesRegex(admin.SafeError, 'private_pointer_required'):
                admin.config()

    def test_arbitrary_pointer_rejected(self):
        with self.private_fixture() as (root, private):
            (root / '.env.backend.local').write_text('ORBE_BACKEND_ENV_FILE=/tmp/unrelated-project.env\n')
            with self.assertRaisesRegex(admin.SafeError, 'private_pointer_rejected'):
                admin.config()

    def test_private_target_symlink_rejected(self):
        with self.private_fixture() as (root, private):
            target = private.with_name('other'); private.rename(target); private.symlink_to(target)
            with self.assertRaisesRegex(admin.SafeError, 'private_pointer_rejected'):
                admin.config()

    def test_private_directory_symlink_rejected(self):
        with self.private_fixture() as (root, private):
            directory = private.parent; actual = directory.with_name('actual')
            directory.rename(actual); directory.symlink_to(actual, target_is_directory=True)
            with self.assertRaisesRegex(admin.SafeError, 'private_pointer_rejected'):
                admin.config()

    def test_external_duplicate_key_rejected(self):
        with self.private_fixture() as (root, private):
            with private.open('a') as file: file.write('SUPABASE_PROJECT_REF=duplicate\n')
            with self.assertRaisesRegex(admin.SafeError, 'duplicate_config_key'):
                admin.config()

    def test_missing_pointer_never_falls_back_to_global(self):
        with self.private_fixture() as (root, private):
            (root / '.env.backend.local').unlink()
            with self.assertRaisesRegex(admin.SafeError, 'private_config_missing'):
                admin.config()

    def test_other_project_rejected_before_database_access(self):
        calls = []
        def request(*args):
            calls.append(args)
            return {'name': 'different-project', 'status': 'ACTIVE_HEALTHY'}
        with self.assertRaisesRegex(admin.SafeError, 'unexpected_project'):
            admin.inspect(request)
        self.assertEqual(len(calls), 1)

    def test_redirect_never_forwards_authorization(self):
        with self.assertRaisesRegex(admin.SafeError, 'redirect_rejected'):
            admin.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://untrusted.invalid')

    def test_provider_error_excludes_body_and_url(self):
        class Opener:
            def open(self, *args, **kwargs):
                raise urllib.error.HTTPError('https://untrusted.invalid/private', 403, 'private-message', {}, io.BytesIO(b'private-payload'))
        with patch.object(admin.urllib.request, 'build_opener', return_value=Opener()):
            with self.assertRaises(admin.SafeError) as raised:
                admin.client('invented-token', 'a' * 20)()
        self.assertEqual(str(raised.exception), 'management_http_403')

    def test_nonempty_database_rejected_before_mutation(self):
        with patch.object(admin, 'config', return_value=('fake', 'a' * 20)), patch.object(admin, 'client') as client, patch.object(admin, 'inspect', return_value=(1, [], {})), patch.object(admin.sys, 'argv', ['admin', 'bootstrap']), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(admin.SafeError, 'bootstrap_requires_empty'):
                admin.main()
            client.return_value.assert_not_called()

    def test_applied_migration_content_drift_rejected(self):
        history = [{'name': 'orbe_20261016170000_bootstrap_changed-hash'}]
        with patch.object(admin, 'config', return_value=('fake', 'a' * 20)), patch.object(admin, 'client') as client, patch.object(admin, 'inspect', return_value=(0, history, {})), patch.object(admin.sys, 'argv', ['admin', 'bootstrap']), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(admin.SafeError, 'applied_migration_hash_mismatch'):
                admin.main()
            client.return_value.assert_not_called()

    def test_duplicate_private_config_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(admin, 'ROOT', Path(folder)):
            (Path(folder) / '.env.backend.local').write_text('SUPABASE_ACCESS_TOKEN=first\nSUPABASE_ACCESS_TOKEN=second\n')
            with self.assertRaisesRegex(admin.SafeError, 'duplicate_config_key'):
                admin.config()

    def test_symlink_private_config_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(admin, 'ROOT', Path(folder)):
            target = Path(folder) / 'other'; target.write_text('invented')
            (Path(folder) / '.env.backend.local').symlink_to(target)
            with self.assertRaisesRegex(admin.SafeError, 'private_config_missing'):
                admin.config()

    def test_all_hashes_are_checked_before_applying_pending_migrations(self):
        import hashlib
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); directory = root / 'supabase/migrations'; directory.mkdir(parents=True)
            baseline = directory / '20261016170000_bootstrap.sql'; baseline.write_text('select 1;')
            (directory / '20261017180000_new.sql').write_text('select 2;')
            (directory / '20261019180000_changed.sql').write_text('select 3;')
            history = [{'name': 'orbe_' + baseline.stem + '_' + hashlib.sha256(baseline.read_bytes()).hexdigest()}, {'name': 'orbe_20261019180000_changed_wrong-hash'}]
            with patch.object(admin, 'ROOT', root), patch.object(admin, 'config', return_value=('fake', 'a' * 20)), patch.object(admin, 'client') as client, patch.object(admin, 'inspect', return_value=(0, history, {})), patch.object(admin.sys, 'argv', ['admin', 'migrate']), contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaisesRegex(admin.SafeError, 'applied_migration_hash_mismatch'):
                    admin.main()
                client.return_value.assert_not_called()

    def test_owner_identifier_cannot_be_sql_input(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(admin, 'ROOT', Path(folder)):
            (Path(folder) / '.env.backend.local').write_text("ORBE_OWNER_USER_ID='; select secret; --\n")
            with patch.object(admin, 'private_values', return_value={'ORBE_OWNER_USER_ID': "'; select secret; --"}), self.assertRaisesRegex(admin.SafeError, 'owner_uuid_missing_or_invalid'):
                admin.owner_id()

    def test_only_publishable_key_enters_client_and_rejected_recovery_stays_off(self):
        keys = [{'type': 'legacy', 'name': 'service_role', 'api_key': 'fake-private-key'}, {'type': 'publishable', 'name': 'default', 'api_key': 'sb_publishable_invented'}]
        with public_configuration_fixture(keys) as root:
            admin.main()
            content = (root / '.env.local').read_text()
            self.assertIn('sb_publishable_invented', content)
            self.assertNotIn('fake-private-key', content)
            self.assertNotIn('fake-admin-token', content)
            self.assertIn('EXPO_PUBLIC_AUTH_RECOVERY_ENABLED=false', content)

    def test_existing_private_variable_is_not_overwritten_or_bundled(self):
        with public_configuration_fixture([{'type': 'publishable', 'name': 'default', 'api_key': 'sb_publishable_invented'}]) as root:
            config = root / '.env.local'; original = 'SUPABASE_ACCESS_TOKEN=invented-private\n'; config.write_text(original)
            with self.assertRaisesRegex(admin.SafeError, 'unexpected_public_config'):
                admin.main()
            self.assertEqual(config.read_text(), original)

    def test_ambiguous_public_key_refuses_to_write_config(self):
        key = {'type': 'publishable', 'name': 'default', 'api_key': 'sb_publishable_invented'}
        with public_configuration_fixture([key, key]) as root:
            with self.assertRaisesRegex(admin.SafeError, 'publishable_key_missing_or_ambiguous'):
                admin.main()
            self.assertFalse((root / '.env.local').exists())

if __name__ == '__main__':
    unittest.main()
