(function(){
'use strict';
if(window.DFOpPhotosArchiveOnlyV1)return;window.DFOpPhotosArchiveOnlyV1=true;
var timer=0,observer=null;
function realCode(v){return /^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim())}
function clean(){
  var box=document.getElementById('dfCloudPhotosBox');
  if(!box)return false;
  var h=box.querySelector('h3');if(h)h.textContent='📦 Fotos arquivadas';
  var note=box.querySelector('.dfOpsTiny');if(note)note.textContent='Somente fotos reais das OPs arquivadas.';
  box.querySelectorAll('.dfCloudPhotoRow').forEach(function(row){var b=row.querySelector('b'),code=String(b&&b.textContent||'').trim();if(!realCode(code))row.remove()});
  return true
}
function schedule(ms){clearTimeout(timer);timer=setTimeout(clean,ms==null?60:ms)}
function attach(){
  var pane=document.getElementById('dfPaneArchive');if(!pane)return false;
  if(observer&&observer.__pane===pane)return true;
  if(observer)try{observer.disconnect()}catch(e){}
  observer=new MutationObserver(function(){schedule(20)});observer.__pane=pane;observer.observe(pane,{childList:true,subtree:true});return true
}
function boot(){clean();if(!attach()){var tries=0,t=setInterval(function(){tries++;if(attach()||tries>20)clearInterval(t)},250)}document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-pane="archive"]'):null;if(b){schedule(30);setTimeout(clean,250)}},true);window.addEventListener('df-ui-ready',function(){attach();schedule(80)});window.addEventListener('pageshow',function(){schedule(80)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
