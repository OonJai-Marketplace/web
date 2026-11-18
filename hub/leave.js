const api='https://nhjsesfhapnjtwlxvirm.supabase.co/rest/v1/rpc/',key='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oanNlc2ZoYXBuanR3bHh2aXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MjUwNTUsImV4cCI6MjEwNTIwMTA1NX0.TVr46PrBacEweD1yts3WR5NOyZnpKFLZdEuSGJKfyO0';
const form=document.querySelector('#leave'),f=form.elements,result=document.querySelector('#result'),days=document.querySelector('#days');
let revision=0,requestId=crypto.randomUUID(),message='',dayState=null,busy=false;
function paint(){result.textContent=message?tr(message):'';days.textContent=typeof dayState==='number'?String(dayState):dayState?tr(dayState):'—'}
window.addEventListener('translated',paint);
async function rpc(fn,data){const r=await fetch(api+fn,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw Error();const body=await r.text();return body?JSON.parse(body):null}
function valid(){return f.from.value&&f.to.value&&f.from.value<=f.to.value&&f.from.value.slice(0,7)===f.to.value.slice(0,7)}
async function count(){const v=++revision;dayState=null;message='';if(!valid()){if(f.from.value&&f.to.value)message='invalid';paint();return}dayState='checking';paint();try{const n=await rpc('hub_leave_days',{p_from:f.from.value,p_to:f.to.value});if(v===revision)dayState=n}catch{if(v===revision)dayState='error'}paint()}
f.from.onchange=f.to.onchange=count;
form.oninput=()=>{requestId=crypto.randomUUID();message='';paint()};
form.onsubmit=async e=>{e.preventDefault();if(busy)return;if(!valid()){message='invalid';paint();return}busy=true;const payload={p_key:requestId,p_code:f.code.value.trim(),p_name:f.namedItem('name').value.trim(),p_kind:f.kind.value,p_from:f.from.value,p_to:f.to.value,p_reason:f.reason.value.trim(),p_details:{timeOff459:f.timeOff.value.trim(),coverage459:f.coverage.value,enoughTime459:f.enoughTime.value,employeeDate459:f.employeeDate.value}};for(const el of f)el.disabled=true;try{await rpc('hub_submit_leave_form',payload);form.reset();revision++;dayState=null;requestId=crypto.randomUUID();message='sent'}catch{message='error'}finally{busy=false;for(const el of f)el.disabled=false;paint()}};
