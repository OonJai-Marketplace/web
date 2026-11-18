const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const accounting=process.argv[2];if(!accounting)throw Error('Pass the Accounting source checkout.');
const helper=fs.readFileSync(accounting+'/mobile/connected-accounting/src/pending-scan.mjs','utf8').replace('export function pendingScan','function pendingScan');
const adapter=fs.readFileSync(__dirname+'/../receipt-native.js','utf8');
const values=new Map(),native=new Map();let mode='success',seen=[];
function launch(){
 const bridge={postMessage(raw){const c=JSON.parse(raw);seen.push(c);queueMicrotask(()=>{let result;
  if(c.action==='scan'){if(mode==='cancel')result={cancelled:true};else{result={requestId:c.requestId,scannedImages:['file:///private/page.jpg']};native.set(c.requestId,result);if(mode==='interrupt'){bridge.onmessage({data:JSON.stringify({id:c.id,error:'copy interrupted'})});return;}}}
  else if(c.action==='recover')result=native.get(c.requestId)||{scannedImages:[]};
  else if(c.action==='readPage')result='dW5jaGFuZ2Vk';
  else if(c.action==='finish'){assert.deepEqual(c.acknowledged,[0]);native.delete(c.requestId);result={};}
  else if(c.action==='upload'){assert.equal(c.data,'Ynl0ZXM=');result={status:308,range:'bytes=0-4'};}
  else result={};bridge.onmessage({data:JSON.stringify({id:c.id,result})});});}};
 class Reader{readAsDataURL(blob){blob.arrayBuffer().then(bytes=>{this.result='data:application/octet-stream;base64,'+Buffer.from(bytes).toString('base64');this.onload();});}}
 const c={window:{OonJaiScanner477:bridge,deviceVault14334:{actor:'owner',unlocked:true,pack:(value,label)=>({actor:'owner',value,label}),unpack:(e,label)=>{assert.equal(e.label,label);return e.value;}}},location:{origin:'https://accounting.oonjai.invalid'},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},crypto,Map,URL,Blob,FileReader:Reader};vm.createContext(c);vm.runInContext(helper+'\n'+adapter,c);return c.window.ReceiptNative214;
}
(async()=>{
 let a=launch();let job=await a.scan({owner:'owner',draftID:'batch',group:'entry'});assert.equal(a.available,true);assert.equal(seen.find(c=>c.action==='scan').singlePage,false);assert.equal(await a.readPage(job.paths[0]),'data:image/jpeg;base64,dW5jaGFuZ2Vk');
 await assert.rejects(a.complete(job),/Protect every/);await a.acknowledge(job,0);await a.complete(job);assert.equal(a.pending(),null);
 mode='interrupt';await assert.rejects(a.scan({owner:'owner',draftID:'batch',group:'entry',replace:'old'}),/interrupted/);assert.equal(seen.filter(c=>c.action==='scan').at(-1).singlePage,true);
 a=launch();job=await a.recover();assert.equal(job.draftID,'batch');await a.acknowledge(job,0);await a.complete(job);
 mode='cancel';assert.equal(await a.scan({owner:'owner',draftID:'batch',group:'entry'}),null);assert.equal(a.pending(),null);
 const response=await a.upload('https://www.googleapis.com/upload/drive/v3/files?upload_id=fixture',{headers:{'Content-Range':'bytes 0-4/5'},body:new Blob(['bytes'])});assert.equal(response.status,308);assert.equal(response.headers.get('Range'),'bytes=0-4');
 await assert.rejects(a.scan({owner:'someone-else',draftID:'batch'}),/Sign in/);
 console.log('PASS Hub bridge: durable native recovery, unchanged JPEG, retake, owner guard, cancellation, acknowledged cleanup and upload bytes/range');
})().catch(e=>{console.error(e);process.exitCode=1});
