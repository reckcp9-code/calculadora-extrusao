(function(){
'use strict';
if(window.DFOpArchiveScrollStabilityV1)return;window.DFOpArchiveScrollStabilityV1=true;
let pane=null,obs=null,raf=0,restoreTimer=0,last={y:0,key:'',top:0},userMovingUntil=0;
const $=id=>document.getElementById(id);
function active(){return !!(pane&&pane.classList.contains('on'))}
function rowKey(row){if(!row)return'';const b=row.querySelector('[data-cloud-open]');if(b)return 'cloud:'+String(b.getAttribute('data-cloud-open')||'');const code=String(row.querySelector('b,strong')?.textContent||'').trim();return code?'code:'+code:''}
function findByKey(key){if(!pane||!key)return null;const rows=pane.querySelectorAll('.dfCloudPhotoRow,.dfOpList');for(const r of rows)if(rowKey(r)===key)return r;return null}
function capture(){
  if(!active())return;
  const y=window.scrollY||window.pageYOffset||0;let chosen=null;
  const rows=pane.querySelectorAll('.dfCloudPhotoRow,.dfOpList');
  for(const r of rows){const rc=r.getBoundingClientRect();if(rc.bottom>90){chosen=r;break}}
  last={y,key:rowKey(chosen),top:chosen?chosen.getBoundingClientRect().top:0};
}
function restore(){
  if(!active()||last.y<1)return;
  const row=findByKey(last.key);
  if(row){const now=row.getBoundingClientRect().top,delta=now-last.top;if(Math.abs(delta)>1)window.scrollBy(0,delta)}
  else if(Math.abs((window.scrollY||0)-last.y)>60)window.scrollTo(0,last.y);
}
function scheduleRestore(){clearTimeout(restoreTimer);restoreTimer=setTimeout(()=>{requestAnimationFrame(()=>{restore();setTimeout(restore,80);setTimeout(restore,220)})},0)}
function onScroll(){userMovingUntil=Date.now()+900;cancelAnimationFrame(raf);raf=requestAnimationFrame(capture)}
function normalizeHeader(){const box=$('dfCloudPhotosBox');if(!box)return;const h=box.querySelector('h3');if(h&&h.textContent!=='📦 Fotos arquivadas')h.textContent='📦 Fotos arquivadas';const n=box.querySelector('.dfOpsTiny');if(n&&n.textContent!=='Somente fotos reais das OPs arquivadas.')n.textContent='Somente fotos reais das OPs arquivadas.'}
function attach(){
  const p=$('dfPaneArchive');if(!p)return false;pane=p;if(obs)try{obs.disconnect()}catch(e){}
  obs=new MutationObserver(()=>{if(!active())return;normalizeHeader();scheduleRestore()});obs.observe(pane,{childList:true,subtree:true});
  capture();normalizeHeader();return true;
}
window.addEventListener('scroll',onScroll,{passive:true});
document.addEventListener('touchstart',()=>{userMovingUntil=Date.now()+1200;capture()},{passive:true});
document.addEventListener('touchmove',()=>{userMovingUntil=Date.now()+1200;capture()},{passive:true});
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="archive"]'))setTimeout(()=>{attach();capture()},80)},true);
window.addEventListener('df-ui-ready',()=>setTimeout(attach,500));window.addEventListener('pageshow',()=>setTimeout(attach,250));
function boot(){if(!attach()){let n=0,t=setInterval(()=>{n++;if(attach()||n>20)clearInterval(t)},250)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
