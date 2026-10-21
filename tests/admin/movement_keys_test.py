import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
spec=importlib.util.spec_from_file_location('movement_keys',Path(__file__).resolve().parents[2]/'scripts/movement-keys.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class MovementKeysTests(unittest.TestCase):
    def test_create_once_and_check_never_rotates_or_reveals(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp);folder.chmod(0o700)
            result=m.execute('init',folder);first=m.read_keys(folder);self.assertTrue(result['created'])
            self.assertEqual(len(set(first.values())),2);self.assertTrue(all(len(v)==64 for v in first.values()))
            self.assertFalse(m.execute('init',folder)['created']);self.assertFalse(m.execute('check',folder)['created']);self.assertEqual(first,m.read_keys(folder))
            self.assertEqual((folder/'movement-keys.env').stat().st_mode&0o777,0o600)
            for value in first.values():self.assertNotIn(value,json.dumps(result))
    def test_check_does_not_create_missing_profile(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp);folder.chmod(0o700)
            with self.assertRaises(m.SafeError):m.execute('check',folder)
            self.assertFalse((folder/'movement-keys.env').exists())
    def test_rejects_unsafe_file_and_directory_without_overwrite(self):
        for kind in ['symlink','hardlink','permissions','invalid','same','directory']:
            with tempfile.TemporaryDirectory() as tmp:
                folder=Path(tmp);folder.chmod(0o700);file=folder/'movement-keys.env'
                if kind=='symlink':file.symlink_to(folder/'absent')
                else:
                    file.write_text('ORBE_MOVEMENT_IDENTITY_KEY='+('11'*32)+'\nORBE_MOVEMENT_CURSOR_KEY='+('11'*32 if kind=='same' else '22'*32)+'\n');file.chmod(0o600)
                    if kind=='hardlink':os.link(file,folder/'other')
                    elif kind=='permissions':file.chmod(0o644)
                    elif kind=='invalid':file.write_text('PRIVATE_INVALID')
                    elif kind=='directory':folder.chmod(0o755)
                before=None if file.is_symlink() else file.read_bytes()
                with self.assertRaises(Exception):m.execute('init',folder)
                if before is not None:self.assertEqual(before,file.read_bytes())
    def test_invalid_operation_never_creates(self):
        with tempfile.TemporaryDirectory()as tmp:
            with self.assertRaises(m.SafeError):m.execute('rotate',tmp)
            self.assertFalse((Path(tmp)/'movement-keys.env').exists())
if __name__=='__main__':unittest.main()
