import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('financial_release',Path(__file__).resolve().parents[2]/'scripts/financial-release.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
spec=importlib.util.spec_from_file_location('fixture_config',Path(__file__).with_name('financial_config_test.py'));f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)
class ReleaseTests(unittest.TestCase):
 def test_enable_and_disable_preserve_credentials(self):
  desired,secrets,functions,receipts,posts,request=f.fixture();m.c.apply_disabled(request,desired,receipts,'configure-disabled');posts.clear();prior=dict(secrets)
  m.transition(request,desired,receipts,True,lambda *args:True)
  self.assertEqual(len(posts),1);self.assertTrue(all(row['value']=='true' for row in posts[0]));self.assertEqual({row['name'] for row in posts[0]},set(m.c.FLAGS))
  self.assertTrue(all(secrets[name]==value for name,value in prior.items() if name not in m.c.FLAGS))
  m.transition(request,desired,receipts,False,lambda *args:True);self.assertTrue(all(secrets[name]==m.c.digest('false') for name in m.c.FLAGS))
 def test_no_enable_with_bad_source_or_secret(self):
  for variant in ('source','secret'):
   desired,secrets,_,receipts,posts,request=f.fixture();m.c.apply_disabled(request,desired,receipts,'configure-disabled');posts.clear()
   if variant=='secret':secrets['PLUGGY_CLIENT_SECRET']=m.c.digest('unknown')
   with self.assertRaises(m.c.SafeError):m.transition(request,desired,receipts,True,lambda *args:variant!='source')
   self.assertEqual(posts,[])
 def test_failed_confirmation_rolls_back(self):
  desired,secrets,_,receipts,posts,request=f.fixture();m.c.apply_disabled(request,desired,receipts,'configure-disabled');posts.clear()
  calls=0
  def tampered(path,method='GET',body=None):
   nonlocal calls
   result=request(path,method,body)
   if path=='/secrets' and method=='POST':
    calls+=1
    if calls==1:secrets[m.c.FLAGS[0]]=m.c.digest('false')
   return result
  with patch.object(m.time,'sleep'),self.assertRaises(m.c.SafeError):m.transition(tampered,desired,receipts,True,lambda *args:True)
  self.assertEqual(len(posts),2);self.assertTrue(all(secrets[name]==m.c.digest('false') for name in m.c.FLAGS))
if __name__=='__main__':unittest.main()
