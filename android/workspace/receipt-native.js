/* Loaded only inside the signed Oon Jai Workspace Android Accounting origin. */
(function(){'use strict';
 const bridge=window.OonJaiScanner477;if(!bridge||location.origin!=='https://accounting.oonjai.invalid')return;
 const waiting=new Map(),queue=pendingScan(localStorage,()=>window.deviceVault14334);let active=false;
 bridge.onmessage=event=>{let r;try{r=JSON.parse(event.data);}catch{return;}const call=waiting.get(r.id);if(!call)return;waiting.delete(r.id);r.error?call.reject(Error(r.error)):call.resolve(r.result);};
 const rpc=(action,value={})=>new Promise((resolve,reject)=>{const id=crypto.randomUUID();waiting.set(id,{resolve,reject});try{bridge.postMessage(JSON.stringify({...value,id,action}));}catch(error){waiting.delete(id);reject(error);}});
 const base64=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
 window.OJM_PUBLIC_APP_URL='https://oonjai-marketplace.github.io/Accounting/';
 window.ReceiptNative214={available:true,platform:'android',workspace477:true,
  pickDirectory:folder=>rpc('pickDirectory',{folder:folder||{}}),
  checkDirectory:folder=>rpc('checkDirectory',{folder}),
  createDirectory:(folder,name)=>rpc('createDirectory',{folder,name}),
  async savePDF(file,folder,sha256){return rpc('writePDF',{folder,name:file.name,sha256,data:await base64(file)});},
  async sharePDF(file){return rpc('sharePDF',{name:file.name,data:await base64(file)});},
  openConnection:url=>rpc('openConnection',{url}),
  async upload(url,options){const r=await rpc('upload',{url,range:options.headers['Content-Range'],data:await base64(new Blob([options.body]))});return {status:r.status,headers:{get:name=>name.toLowerCase()==='range'?r.range:null}};},
  async scan(context){
   if(active)throw Error('The document scanner is already open.');
   const previous=await this.recover();if(previous)return previous;
   const interrupted=queue.context();if(interrupted)queue.cancel(interrupted.id);
   const request=queue.start(context);active=true;
   try{const result=await rpc('scan',{requestId:request.id,singlePage:!!context.replace});if(result.cancelled||!result.scannedImages?.length){queue.cancel(request.id);return null;}queue.record(result);return queue.pending();}
   finally{active=false;}
  },
  pending:()=>queue.pending(),
  async recover(){const request=queue.context();if(!request)return null;if(queue.pending())return queue.pending();const result=await rpc('recover',{requestId:request.id});if(result.scannedImages?.length)queue.record(result);return queue.pending();},
  async readPage(path){const job=queue.pending(),index=job?.paths.indexOf(path);if(!job||index<0)throw Error('Reopen the scan in its original account.');return 'data:image/jpeg;base64,'+await rpc('readPage',{requestId:job.id,index});},
  async acknowledge(job,index){queue.acknowledge(job.id,index);},
  async complete(job){queue.assertComplete(job.id);const acknowledged=queue.pending().acknowledged;await rpc('finish',{requestId:job.id,acknowledged});queue.complete(job.id);}
 };
})();
