(function(){
'use strict';
if(window.DFOpCloudLocalTimeV1)return;window.DFOpCloudLocalTimeV1=true;
let observer=null,timer=0;
function pad(n){return String(n).padStart(2,'0')}
function localText(utc){const d=new Date(String(utc).replace(' ','T')+'Z');if(Number.isNaN(d.getTime()))return utc;return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())}
function fix(){
  const box=document.getElementById('dfCloudPhotosBox');if(!box)return false;
  box.querySelectorAll('.dfCloudPhotoRow .dfOpsTiny').forEach(el=>{
    const text=String(el.textContent||''),m=text.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})(\s*•.*)$/);if(!m)return;
    const raw=el.dataset.dfUtcStamp||m[1];el.dataset.dfUtcStamp=raw;const local=localText(raw);if(text!==local+m[2])el.textContent=local+m[2];
  });
  return true;
}
function schedule(ms){clearTimeout(timer);timer=setTimeout(fix,ms==null?40:ms)}
function attach(){const box=document.getElementById('dfCloudPhotosBox');if(!box)return false;if(observer?.__box===box)return true;if(observer)try{observer.disconnect()}catch(e){};observer=new MutationObserver(()=>schedule(25));observer.__box=box;observer.observe(box,{childList:true,subtree:true});return true}
function boot(){fix();attach();setTimeout(()=>{attach();fix()},500);setTimeout(()=>{attach();fix()},1500)}
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="archive"],#dfCloudRefresh'))setTimeout(()=>{attach();fix()},150)},true);
window.addEventListener('df-ui-ready',()=>setTimeout(boot,150));
window.addEventListener('df-op-remote-merged',()=>setTimeout(()=>{attach();fix()},100));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
