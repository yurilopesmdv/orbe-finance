import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
export const releaseFiles = ['app.json','package-lock.json','src/config/runtime.ts'];
export function verifyOwnerRelease(root,directory,config){
 const filename=path.join(directory,'financial-release.json'),info=lstatSync(filename);
 if(info.isSymbolicLink()||!info.isFile()||(info.mode&0o777)!==0o600||info.nlink!==1||info.uid!==process.getuid()||realpathSync(directory)!==path.resolve(directory)||path.resolve(directory).startsWith(path.resolve(root)+path.sep))throw Error('owner_release_receipt_rejected');
 if(info.size>16384)throw Error('owner_release_receipt_rejected');
 const receipt=JSON.parse(readFileSync(filename,'utf8'));
 if(receipt.version!==1||receipt.enabled!==true||receipt.projectRef!=='vvaufaoahotmaocrcyij'||receipt.projectId!==config.extra?.eas?.projectId||receipt.projectId!=='69843dfe-ab1b-469e-bb78-c7948bbf1d9b'||receipt.runtime!=='57.0.0'||receipt.scope!=='existing-owner-only')throw Error('owner_release_receipt_rejected');
 for(const file of releaseFiles){if(lstatSync(path.join(root,file)).isSymbolicLink()||receipt.files?.[file]!==createHash('sha256').update(readFileSync(path.join(root,file))).digest('hex'))throw Error('owner_release_sources_changed');}
 return true;
}
