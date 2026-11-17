const installedHub=location.hostname==='hub.oonjai.invalid';
const publicHub='https://oonjai-marketplace.github.io/web/hub/';
document.querySelector('#share-hub').onclick=async()=>{
 if(installedHub){location.assign('/share');return}
 try{if(navigator.share)await navigator.share({title:'Oon Jai Hub',url:publicHub});else{await navigator.clipboard.writeText(publicHub);const n=document.querySelector('#hub-status');n.hidden=false;n.textContent=tr('copied')}}catch(e){if(e.name!=='AbortError')prompt(tr('share'),publicHub)}
};
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});

const installButton=document.querySelector('#install-hub');
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();installButton.hidden=false;
 installButton.onclick=async()=>{await event.prompt();installButton.hidden=true};
});
const downloadButton=document.querySelector('#download-app');
if(installedHub)downloadButton.hidden=true;
document.addEventListener('click',e=>{const menu=document.querySelector('#more');if(!menu.contains(e.target))menu.open=false});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const menu=document.querySelector('#more');if(menu.open){menu.open=false;menu.querySelector('summary').focus()}}});
let readyApk;
downloadButton.onclick=async()=>{
 const save=()=>{const a=document.createElement('a');a.href=readyApk;a.download='Oon-Jai-1.2.apk';a.click()};
 if(readyApk){save();return}
 downloadButton.disabled=true;downloadButton.dataset.t='loadingApp';translate();
 try{
   const parts=[];
   for(let i=0;i<3;i++){
     const response=await fetch('android-1.2/application.part'+i);
     if(!response.ok)throw Error();
     parts.push(await response.arrayBuffer());
   }
   const file=new Blob(parts,{type:'application/vnd.android.package-archive'});
   const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
   const hex=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
   if(hex!=='e02b01e42ec127c957a9b4a88712f24a4539f3fe647c22c7aaf35996f3cf8dfc')throw Error();
   readyApk=URL.createObjectURL(file);downloadButton.dataset.t='saveApp';save();
 }catch{downloadButton.dataset.t='downloadError'}
 finally{downloadButton.disabled=false;translate()}
};
