(function(){
'use strict';
if(window.DFOpModalScrollLockV1)return;window.DFOpModalScrollLockV1=true;
let locked=false,scrollY=0,observer=null,timer=0;
const $=id=>document.getElementById(id);
function addStyle(){
  if($('dfOpModalScrollLockStyle'))return;
  const s=document.createElement('style');s.id='dfOpModalScrollLockStyle';s.textContent=`
#dfOpModal{position:fixed!important;inset:0!important;z-index:2147483000!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important;background:rgba(2,6,23,.985)!important;padding:12px!important;box-sizing:border-box!important;transform:none!important}
#dfOpModal .dfOpModalBox{position:relative!important;max-width:720px!important;margin:0 auto!important;min-height:auto!important;transform:none!important}
#dfOpModal #dfCloseModal{position:sticky!important;top:0!important;z-index:5!important;margin:0 0 10px!important;box-shadow:0 8px 20px rgba(2,6,23,.85)!important}
html.dfOpModalLocked,body.dfOpModalLocked{overscroll-behavior:none!important}
`;
  document.head.appendChild(s);
}
function moveToBody(){const m=$('dfOpModal');if(m&&m.parentNode!==document.body)document.body.appendChild(m);return m}
function lock(){if(locked)return;scrollY=window.scrollY||window.pageYOffset||0;locked=true;document.documentElement.classList.add('dfOpModalLocked');document.body.classList.add('dfOpModalLocked');document.body.style.position='fixed';document.body.style.top=(-scrollY)+'px';document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%';}
function unlock(){if(!locked)return;locked=false;document.documentElement.classList.remove('dfOpModalLocked');document.body.classList.remove('dfOpModalLocked');document.body.style.position='';document.body.style.top='';document.body.style.left='';document.body.style.right='';document.body.style.width='';window.scrollTo(0,scrollY)}
function sync(){addStyle();const m=moveToBody();if(!m){unlock();return false}if(m.classList.contains('on')){lock();if(m.scrollTop<0)m.scrollTop=0}else unlock();return true}
function schedule(ms){clearTimeout(timer);timer=setTimeout(sync,ms==null?30:ms)}
function watch(){const m=moveToBody();if(!m)return false;if(observer)observer.disconnect();observer=new MutationObserver(schedule);observer.observe(m,{attributes:true,attributeFilter:['class'],childList:true,subtree:false});return true}
function boot(){addStyle();let n=0,t=setInterval(function(){if(sync()){watch();clearInterval(t)}else if(++n>40)clearInterval(t)},150);setTimeout(function(){sync();watch()},1200)}
document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('[data-view],#dfCloseModal,#dfFixSave')){setTimeout(sync,20);setTimeout(sync,180)}},true);
window.addEventListener('df-ui-ready',function(){setTimeout(function(){sync();watch()},120)});
window.addEventListener('pageshow',function(){setTimeout(sync,80)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
