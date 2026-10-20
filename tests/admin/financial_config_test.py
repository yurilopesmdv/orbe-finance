import importlib.util
import json
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('financial_config',Path(__file__).resolve().parents[2]/'scripts/financial-config.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
CREDS={'PLUGGY_CLIENT_ID':'invented-client','PLUGGY_CLIENT_SECRET':'invented-secret-12345'}
def fixture(change=None):
    desired=m.desired_values(CREDS,'sb_secret_invented');secrets={'ORBE_METADATA_ENABLED':m.digest('true'),'ORBE_PUBLISHABLE_KEY':m.digest('sb_publishable_invented')}
    functions=[{'slug':slug,'id':'invented-'+slug,'version':4,'ezbr_sha256':'a'*64,'status':'ACTIVE','verify_jwt':False} for slug in m.SLUGS]
    receipts={row['slug']:{'project_ref':m.REF,'id':row['id'],'version':row['version']} for row in functions};posts=[]
    def request(path,method='GET',body=None):
        if path=='/functions':return json.loads(json.dumps(functions))
        if path=='/secrets' and method=='GET':return [{'name':k,'value':v} for k,v in secrets.items()]
        if path=='/secrets' and method=='POST':
            posts.append(body)
            for row in body:secrets[row['name']]=m.digest(row['value'])
            if change:change(secrets,functions)
            return {}
        raise AssertionError('unexpected request')
    return desired,secrets,functions,receipts,posts,request
class FinancialConfigTests(unittest.TestCase):
    def test_only_missing_disabled_targets_added_and_metadata_preserved(self):
        desired,secrets,_,receipts,posts,request=fixture();prior=dict(secrets)
        result,_=m.apply_disabled(request,desired,receipts,'configure-disabled')
        self.assertTrue(result['configuration_ready']);self.assertEqual(result['added_secrets'],7)
        self.assertEqual({r['name'] for r in posts[0]},m.TARGETS)
        self.assertTrue(all(row['value']=='false' for row in posts[0] if row['name'] in m.FLAGS))
        self.assertTrue(all(secrets[k]==v for k,v in prior.items()))
        self.assertNotIn(CREDS['PLUGGY_CLIENT_SECRET'],json.dumps(result))
    def test_check_never_mutates_and_repeat_is_idempotent(self):
        desired,_,_,receipts,posts,request=fixture()
        self.assertFalse(m.apply_disabled(request,desired,receipts,'check')[0]['configuration_ready']);self.assertEqual(posts,[])
        m.apply_disabled(request,desired,receipts,'configure-disabled')
        self.assertEqual(m.apply_disabled(request,desired,receipts,'configure-disabled')[0]['added_secrets'],0);self.assertEqual(len(posts),1)
    def test_conflicting_existing_secret_is_not_overwritten(self):
        desired,secrets,_,receipts,posts,request=fixture();secrets['PLUGGY_CLIENT_SECRET']=m.digest('different')
        with self.assertRaises(m.SafeError):m.apply_disabled(request,desired,receipts,'configure-disabled')
        self.assertEqual(posts,[])
    def test_version_change_requires_same_source_hash_and_identity(self):
        def bump(secrets,functions):
            for row in functions:row['version']+=1
        desired,_,_,receipts,_,request=fixture(bump);_,current=m.apply_disabled(request,desired,receipts,'configure-disabled');self.assertEqual(current['orbe-bridge']['version'],5)
        def tamper(secrets,functions):functions[0]['ezbr_sha256']='b'*64
        desired,_,_,receipts,_,request=fixture(tamper)
        with self.assertRaises(m.SafeError):m.apply_disabled(request,desired,receipts,'configure-disabled')
    def test_unspecified_metadata_change_is_detected(self):
        desired,_,_,receipts,_,request=fixture(lambda secrets,functions:secrets.update(ORBE_METADATA_ENABLED=m.digest('false')))
        with self.assertRaises(m.SafeError):m.apply_disabled(request,desired,receipts,'configure-disabled')
    def test_enabling_flag_is_rejected_before_any_request(self):
        desired,_,_,receipts,_,_=fixture();desired['ORBE_BRIDGE_ENABLED']='true'
        with self.assertRaises(m.SafeError):m.apply_disabled(lambda *args: self.fail('network'),desired,receipts,'configure-disabled')
    def test_raw_or_duplicate_secret_metadata_rejected(self):
        for rows in [[{'name':'x','value':'PRIVATE'}],[{'name':'x','value':'a'*64}]*2]:
            with self.assertRaises(m.SafeError):m.secrets_map(rows)
    def test_existing_version_drift_needs_positive_source_audit(self):
        desired,_,functions,receipts,_,request=fixture()
        for row in functions:row['version']+=1
        with self.assertRaises(m.SafeError):m.apply_disabled(request,desired,receipts,'check')
        with self.assertRaises(m.SafeError):m.apply_disabled(request,desired,receipts,'check',lambda slug,record:False)
        result,_=m.apply_disabled(request,desired,receipts,'check',lambda slug,record:True)
        self.assertFalse(result['configuration_ready'])
    def test_archive_change_after_environment_requires_positive_source_audit(self):
        def bump(secrets,functions):
            for row in functions:row['version']+=1;row['ezbr_sha256']='b'*64
        desired,_,_,receipts,_,request=fixture(bump)
        result,current=m.apply_disabled(request,desired,receipts,'configure-disabled',lambda slug,record:True)
        self.assertTrue(result['configuration_ready']);self.assertEqual(current['orbe-bridge']['version'],5)
if __name__=='__main__':unittest.main()
