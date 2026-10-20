import contextlib
import importlib.util
import io
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('owner_setup',Path(__file__).resolve().parents[2]/'scripts/owner-setup.py')
setup=importlib.util.module_from_spec(spec);spec.loader.exec_module(setup)
OWNER='00000000-0000-4000-8000-000000000001'
EMAIL='invented@example.invalid'
AUTH={'disable_signup':True,'mailer_otp_length':6,'mailer_otp_exp':600}
USER={'id':OWNER,'email':EMAIL,'is_anonymous':False,'email_confirmed_at':'2026-10-20T00:00:00Z'}
CODE={**USER,'email_otp':'123456','verification_type':'recovery','action_link':'never-save-this-link','hashed_token':'never-save-this-hash'}
class OwnerSetupTests(unittest.TestCase):
    def run_setup(self,path,user=USER,code=CODE,auth=AUTH,configured=True):
        calls=[]
        def request(route,method='GET',body=None):
            calls.append((route,method,body))
            return user if route.startswith('/admin/users/') else code
        setup.prepare(lambda *args:[{'configured':configured}],OWNER,auth,request,path,lambda:1000)
        return calls
    def test_private_file_has_only_needed_details_and_no_stdout(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'owner-setup.txt';stdout=io.StringIO()
            with contextlib.redirect_stdout(stdout): calls=self.run_setup(path)
            self.assertEqual(stdout.getvalue(),'');self.assertEqual(path.stat().st_mode & 0o777,0o600);self.assertEqual(path.parent.stat().st_mode & 0o777,0o700)
            body=path.read_text();self.assertIn(EMAIL,body);self.assertIn('123456',body)
            self.assertNotIn('never-save',body);self.assertNotIn(OWNER,body)
            self.assertEqual(calls,[('/admin/users/'+OWNER,'GET',None),('/admin/generate_link','POST',{'type':'recovery','email':EMAIL})])
    def test_policy_must_remain_closed_and_otp_short_lived(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'code'
            for auth in [{**AUTH,'disable_signup':False},{**AUTH,'mailer_otp_length':8},{**AUTH,'mailer_otp_exp':3600}]:
                with self.assertRaises(setup.admin.SafeError):self.run_setup(path,auth=auth)
            self.assertFalse(path.exists())
    def test_wrong_unconfirmed_or_anonymous_owner_cannot_generate_code(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'code'
            for user in [{**USER,'id':'another-user'},{**USER,'email_confirmed_at':None},{**USER,'is_anonymous':True},{**USER,'email':'bad\naddress'},None]:
                with self.assertRaises(setup.admin.SafeError):self.run_setup(path,user=user)
            with self.assertRaises(setup.admin.SafeError):self.run_setup(path,configured=False)
            self.assertFalse(path.exists())
    def test_response_must_bind_code_to_owner_email_and_recovery_type(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'code'
            for code in [{**CODE,'id':'another-user'},{**CODE,'email':'other@example.invalid'},{**CODE,'verification_type':'signup'},{**CODE,'email_otp':'12345a'},None]:
                with self.assertRaises(setup.admin.SafeError):self.run_setup(path,code=code)
            self.assertFalse(path.exists())
    def test_dangling_symlink_and_hardlink_are_rejected_without_overwrite(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'code';target=Path(folder)/'target';path.symlink_to(target)
            with self.assertRaises(setup.admin.SafeError):self.run_setup(path)
            self.assertFalse(target.exists());path.unlink();target.write_text('keep');os.link(target,path)
            with self.assertRaises(setup.admin.SafeError):self.run_setup(path)
            self.assertEqual(target.read_text(),'keep')
    def test_existing_private_file_is_restricted_before_replacement(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'code';path.write_text('old');path.chmod(0o644);self.run_setup(path)
            self.assertEqual(path.stat().st_mode & 0o777,0o600);self.assertNotIn('old',path.read_text())
    def test_expired_generation_never_writes_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'code';clock=iter([1000,1600])
            with self.assertRaisesRegex(setup.admin.SafeError,'expired'):
                setup.prepare(lambda *args:[{'configured':True}],OWNER,AUTH,lambda route,*args:USER if route.startswith('/admin/users') else CODE,path,lambda:next(clock))
            self.assertFalse(path.exists())
    def test_arbitrary_auth_paths_and_user_mutations_are_rejected(self):
        request=setup.auth_client('a'*20,'invented-service-key')
        for route,method,body in [('/admin/users','POST',{}),('/admin/users/'+OWNER,'PUT',{'password':'never'}),('/recover','POST',{}),('/admin/generate_link','POST',{'type':'signup','email':EMAIL})]:
            with self.assertRaises(setup.admin.SafeError):request(route,method,body)
if __name__=='__main__':unittest.main()
