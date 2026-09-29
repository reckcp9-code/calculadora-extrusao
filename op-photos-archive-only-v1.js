(function(){
'use strict';
if(window.DFOpPhotosArchiveOnlyV1)return;window.DFOpPhotosArchiveOnlyV1=true;
let timer=0;
function realCode(v){return /^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim())}
function clean(){
  const box=document.getElementById('dfCloudPhotosBox');if(!box)return false;
  const h=box.querySelector('h3');if(h&&h.textContent!=='📦 Fotos arquivadas')h.textContent='📦 Fotos arquivadas';
  const note=box.querySelector('.dfOpsTiny');if(note&&note.textContent!=='Somente fotos reais das OPs arquivadas.')note.textContent='Somente fotos reais das OPs arquivadas.';
  box.querySelectorAll('.dfCloudPhotoRow').forEach(row=>{const code=String(row.querySelector('b')?.textContent||'').trim();if(!realCode(code))row.remove()});
  return true;
}
function schedule(ms){clearTimeout(timer);timer=setTimeout(clean,ms==null?80:ms)}
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="archive"],#dfCloudRefresh')){schedule(80);setTimeout(clean,500)}},true);
window.addEventListener('df-ui-ready',()=>schedule(300));
window.addEventListener('pageshow',()=>schedule(200));
window.addEventListener('df-op-cloud-synced',()=>schedule(350));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(300),{once:true});else schedule(300);
})();
