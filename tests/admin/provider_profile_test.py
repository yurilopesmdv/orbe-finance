import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('profile',Path(__file__).resolve().parents[2]/'scripts/provider-profile.py');profile=importlib.util.module_from_spec(spec);spec.loader.exec_module(profile)
class ProfileGuards(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name);self.directory=self.root/'private';self.patch=patch.object(profile,'PRIVATE_DIR',self.directory);self.patch.start();self.addCleanup(self.patch.stop)
    def initialize(self):return profile.execute('init')
    def path(self):return self.directory/'pluggy.env'
    def test_init_private_empty_and_existing_never_overwritten(self):
        value=self.initialize();self.assertFalse(value['credentials_configured']);self.assertEqual(self.directory.stat().st_mode&0o777,0o700);self.assertEqual(self.path().stat().st_mode&0o777,0o600)
        original=self.path().read_bytes();self.assertFalse(self.initialize()['created']);self.assertEqual(self.path().read_bytes(),original)
    def test_valid_fake_credentials_only_redacted_status(self):
        self.initialize();self.path().write_text('PLUGGY_CLIENT_ID=invented-client\nPLUGGY_CLIENT_SECRET=invented-private-secret-12345\n');value=profile.execute('check');self.assertTrue(value['credentials_configured']);self.assertEqual(value['provider_calls'],0);self.assertNotIn('invented-private',json.dumps(value))
    def test_invalid_duplicate_unknown_or_oversized_rejected(self):
        self.initialize()
        for text in ['PLUGGY_CLIENT_ID=x\nPLUGGY_CLIENT_SECRET=short','PLUGGY_CLIENT_ID=\nPLUGGY_CLIENT_ID=\nPLUGGY_CLIENT_SECRET=','PLUGGY_CLIENT_ID=\nPLUGGY_CLIENT_SECRET=\nEXPO_PUBLIC_SECRET=bad','x'*8193]:
            self.path().write_text(text)
            with self.assertRaises(profile.SafeError):profile.execute('check')
    def test_symlink_file_and_ancestor_rejected(self):
        self.directory.mkdir();target=self.root/'outside';target.write_text(profile.TEMPLATE);self.path().symlink_to(target)
        with self.assertRaises(profile.SafeError):self.initialize()
        self.path().unlink();self.directory.rmdir();self.directory.symlink_to(self.root,target_is_directory=True)
        with self.assertRaises(profile.SafeError):self.initialize()
    def test_hardlink_rejected_without_modifying_source(self):
        self.initialize();other=self.root/'linked';os.link(self.path(),other)
        with self.assertRaises(profile.SafeError):profile.execute('check')
        self.assertEqual(other.read_text(),profile.TEMPLATE)
    def test_non_private_file_mode_rejected(self):
        self.initialize();self.path().chmod(0o644)
        with self.assertRaisesRegex(profile.SafeError,'provider_profile_permissions_rejected'):profile.execute('check')
    def test_foreign_owner_rejected(self):
        self.initialize()
        with patch.object(profile.os,'getuid',return_value=os.getuid()+1):
            with self.assertRaisesRegex(profile.SafeError,'provider_profile_owner_rejected'):profile.execute('check')
if __name__=='__main__':unittest.main()
