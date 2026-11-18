const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const values={code:'OJ-TEST',name:'Example employee',kind:'unpaid',from:'2026-11-23',to:'2026-11-24',reason:'Requested absence',timeOff:'2 days',coverage:'yes',enoughTime:'no',employeeDate:''};
 const fields=Object.fromEntries(Object.entries(values).map(([k,value])=>[k,{value,disabled:false}]));fields.namedItem=k=>fields[k];fields[Symbol.iterator]=function*(){for(const k of Object.keys(values))yield fields[k]};
 let resets=0,resolveFetch,requests=[];const result={},days={},form={elements:fields,reset(){resets++;}};
 const ctx={document:{querySelector:s=>({'#leave':form,'#result':result,'#days':days})[s]},window:{addEventListener(){}},tr:k=>k,crypto:{randomUUID:()=> 'same-request'},fetch:(url,init)=>{requests.push({url,payload:JSON.parse(init.body)});return new Promise(r=>resolveFetch=r);}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('hub/leave.js','utf8'),ctx);
 const first=form.onsubmit({preventDefault(){}});await form.onsubmit({preventDefault(){}});assert.equal(requests.length,1);assert(requests[0].url.endsWith('/hub_submit_leave_form'));assert.equal(requests[0].payload.p_kind,'unpaid');assert.equal(requests[0].payload.p_details.coverage459,'yes');assert(!JSON.stringify(requests[0].payload).includes('<html'));assert(Object.values(fields).filter(x=>x&&typeof x==='object').every(x=>x.disabled));
 resolveFetch({ok:false});await first;assert.equal(resets,0);assert.equal(result.textContent,'error');assert.equal(fields.reason.value,'Requested absence');
 const retry=form.onsubmit({preventDefault(){}});assert.equal(requests[1].payload.p_key,requests[0].payload.p_key);resolveFetch({ok:true,text:async()=>''});await retry;assert.equal(resets,1);assert.equal(result.textContent,'sent');
 console.log('PASS: Hub sends only form fields, prevents duplicate requests, preserves failed input and retries the same request ID');
})().catch(e=>{console.error(e);process.exitCode=1});
