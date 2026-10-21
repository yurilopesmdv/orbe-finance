import importlib.util,json,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('pm',Path(__file__).resolve().parents[2]/'scripts/provider-metadata.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
ID='00000000-0000-4000-8000-000000000001';creds={'PLUGGY_CLIENT_ID':'synthetic-client','PLUGGY_CLIENT_SECRET':'synthetic-secret-12345'}
items=[{'institution':'mercado-pago','itemId':ID}];now=1792584000
item={'id':ID,'connector':{'name':'MeuPluggy','isSandbox':False},'status':'UPDATED','executionStatus':'SUCCESS','error':None,'consentExpiresAt':'2099-01-01T00:00:00Z','products':['ACCOUNTS','TRANSACTIONS'],'parameters':{'secret':'SYNTHETIC_PRIVATE'}}
consent={'itemId':ID,'createdAt':'2026-01-01T00:00:00Z','expiresAt':None,'revokedAt':None,'products':['ACCOUNTS'],'openFinancePermissionsGranted':['ACCOUNTS_ALL']}
def source(rows):return {'page':1,'total':len(rows),'totalPages':1 if rows else 0,'results':rows}
class Response:
    status=200
    headers={'Content-Type':'application/json'}
    def __init__(self,url,data):self.url=url;self.data=json.dumps(data).encode()
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def geturl(self):return self.url
    def read(self,limit):return self.data[:limit]
class MetadataTests(unittest.TestCase):
    def test_only_fixed_technical_endpoints_and_no_private_output(self):
        calls=[]
        def request(req,timeout):
            calls.append(req.full_url)
            return Response(req.full_url,{'apiKey':'synthetic-provider-key'} if req.full_url.endswith('/auth') else source([consent]) if '/consents?'in req.full_url else item)
        result=m.inspect_metadata(creds,items,request,now);self.assertEqual(calls,['https://api.pluggy.ai/auth','https://api.pluggy.ai/items/'+ID,'https://api.pluggy.ai/consents?itemId='+ID]);self.assertTrue(result['connections'][0]['open_finance_permissions_present']);self.assertFalse(result['connections'][0]['bank_expiry_proven'])
        for private in [ID,'synthetic-provider-key','SYNTHETIC_PRIVATE',creds['PLUGGY_CLIENT_SECRET']]:self.assertNotIn(private,json.dumps(result))
    def test_foreign_consent_only_returns_schema_flags_never_proof_or_identifier(self):
        def request(req,timeout):
            data={'apiKey':'synthetic-provider-key'} if req.full_url.endswith('/auth') else source([{**consent,'itemId':'00000000-0000-4000-8000-000000000099'}]) if '/consents?'in req.full_url else item
            return Response(req.full_url,data)
        result=m.inspect_metadata(creds,items,request,now);report=result['connections'][0]
        self.assertFalse(report['consent_schema_confirmed']);self.assertFalse(report['consent_rows_match_proxy']);self.assertNotIn('00000000-0000-4000-8000-000000000099',json.dumps(result));self.assertNotIn('open_finance_permissions_present',report)
    def test_revoked_expired_multiple_and_absent_permissions_not_proof(self):
        for rows in [[],[{**consent,'revokedAt':'2026-01-02T00:00:00Z'}],[{**consent,'expiresAt':'2026-01-02T00:00:00Z'}],[consent,consent],[{**consent,'openFinancePermissionsGranted':[]}]]:
            self.assertFalse(m.project_consents(source(rows),ID,now)['open_finance_permissions_present'])
    def test_wrong_item_pagination_and_invalid_dates_rejected(self):
        for raw in [{**source([consent]),'totalPages':2},source([{**consent,'itemId':'foreign'}]),source([{**consent,'createdAt':'bad'}])]:
            with self.assertRaises(m.SafeError):m.project_consents(raw,ID,now)
    def test_bad_inventory_or_credentials_stop_before_network(self):
        for rows in [[{'institution':'unknown','itemId':ID}],items+items,[{'institution':'bradesco','itemId':'bad'}]]:
            with self.assertRaises(m.SafeError):m.inspect_metadata(creds,rows,lambda *args,**kwargs:self.fail('network'),now)
    def test_oversized_response_redirect_and_http_status_rejected(self):
        for kind in ['large','redirect','status','mime']:
            def request(req,timeout):
                result=Response(req.full_url,{'apiKey':'synthetic-provider-key'})
                if kind=='large':result.data=b'x'*4097
                if kind=='redirect':result.url='https://invalid.example'
                if kind=='status':result.status=403
                if kind=='mime':result.headers={'Content-Type':'text/html'}
                return result
            with self.assertRaises(m.SafeError):m.inspect_metadata(creds,items,request,now)
if __name__=='__main__':unittest.main()
