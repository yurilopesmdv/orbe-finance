import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifyOwnerRelease,releaseFiles} from '../../scripts/owner-release-guard.mjs';
test('private owner release binds exact project, client hashes and enabled state',()=>{
 const base=mkdtempSync(path.join(tmpdir(),'orbe-release-')),root=path.join(base,'repo'),directory=path.join(base,'private');mkdirSync(root);mkdirSync(directory,{mode:0o700});mkdirSync(path.join(root,'src/config'),{recursive:true});
 const config={extra:{eas:{projectId:'69843dfe-ab1b-469e-bb78-c7948bbf1d9b'}}};
 const receipt={version:1,enabled:true,projectRef:'vvaufaoahotmaocrcyij',projectId:config.extra.eas.projectId,runtime:'57.0.0',scope:'existing-owner-only',files:{}};
 try{
  for(const file of releaseFiles){writeFileSync(path.join(root,file),'invented-source');receipt.files[file]=createHash('sha256').update('invented-source').digest('hex');}
  const save=()=>writeFileSync(path.join(directory,'financial-release.json'),JSON.stringify(receipt),{mode:0o600});save();assert.equal(verifyOwnerRelease(root,directory,config),true);
  receipt.enabled=false;save();assert.throws(()=>verifyOwnerRelease(root,directory,config));receipt.enabled=true;save();
  writeFileSync(path.join(root,'src/config/runtime.ts'),'changed');assert.throws(()=>verifyOwnerRelease(root,directory,config));
 }finally{rmSync(base,{recursive:true,force:true});}
});
