(function(){
'use strict';
if(window.DFOpModalScrollLockV3)return;window.DFOpModalScrollLockV3=true;

let locked=false,scrollY=0,timer=0,rootObserver=null;
let obsOp=null,obsCloud=null,wasOpOpen=false,wasCloudOpen=false;
let htmlPrev=null,bodyPrev=null;
const $=id=>document.getElementById(id);

function addStyle(){
  if($('dfOpModalScrollLockStyleV3'))return;
  const old=$('dfOpModalScrollLockStyleV2');if(old)try{old.remove()}catch(e){}
  const s=document.createElement('style');s.id='dfOpModalScrollLockStyleV3';s.textContent=`
#dfOpModal,#dfCloudViewer{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100%!important;height:100dvh!important;min-height:100dvh!important;max-width:none!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;box-sizing:border-box!important;transform:none!important;background:rgba(2,6,23,.985)!important}
#dfOpModal{z-index:2147483000!important;padding:max(10px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom))!important}
#dfCloudViewer{z-index:2147483100!important;padding:max(10px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom))!important}
#dfOpModal .dfOpModalBox,#dfCloudViewer .box{position:relative!important;max-width:760px!important;margin:0 auto!important;min-height:auto!important;transform:none!important}
#dfOpModal #dfCloseModal,#dfCloudViewer #dfCloudClose{position:sticky!important;top:0!important;z-index:20!important;margin:0 0 10px!important;box-shadow:0 8px 20px rgba(2,6,23,.92)!important}
#dfCloudViewerBody img{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:calc(100dvh - 175px)!important;object-fit:contain!important}
html.dfOpModalLocked,body.dfOpModalLocked{overflow:hidden!important;overscroll-behavior:none!important;max-height:100dvh!important}
`;
  document.head.appendChild(s);
}

function moveToBody(id){const m=$(id);if(m&&m.parentNode!==document.body)document.body.appendChild(m);return m}
function opModal(){return moveToBody('dfOpModal')}
function cloudModal(){return moveToBody('dfCloudViewer')}
function isOpen(m){return !!(m&&m.classList.contains('on'))}

function lock(){
  if(locked)return;
  scrollY=window.scrollY||window.pageYOffset||0;locked=true;
  const h=document.documentElement,b=document.body;
  htmlPrev={overflow:h.style.overflow,overscrollBehavior:h.style.overscrollBehavior,maxHeight:h.style.maxHeight};
  bodyPrev={overflow:b.style.overflow,overscrollBehavior:b.style.overscrollBehavior,maxHeight:b.style.maxHeight};
  h.classList.add('dfOpModalLocked');b.classList.add('dfOpModalLocked');
  h.style.overflow='hidden';h.style.overscrollBehavior='none';h.style.maxHeight='100dvh';
  b.style.overflow='hidden';b.style.overscrollBehavior='none';b.style.maxHeight='100dvh';
}
function unlock(){
  if(!locked)return;locked=false;
  const h=document.documentElement,b=document.body,hp=htmlPrev||{},bp=bodyPrev||{};
  h.classList.remove('dfOpModalLocked');b.classList.remove('dfOpModalLocked');
  h.style.overflow=hp.overflow||'';h.style.overscrollBehavior=hp.overscrollBehavior||'';h.style.maxHeight=hp.maxHeight||'';
  b.style.overflow=bp.overflow||'';b.style.overscrollBehavior=bp.overscrollBehavior||'';b.style.maxHeight=bp.maxHeight||'';
  htmlPrev=null;bodyPrev=null;
  requestAnimationFrame(()=>{try{window.scrollTo(0,scrollY)}catch(e){}});
}

function sync(){
  addStyle();
  const op=opModal(),cloud=cloudModal(),opOpen=isOpen(op),cloudOpen=isOpen(cloud);
  if(opOpen||cloudOpen)lock();else unlock();
  if(opOpen&&!wasOpOpen&&op)op.scrollTop=0;
  if(cloudOpen&&!wasCloudOpen&&cloud)cloud.scrollTop=0;
  wasOpOpen=opOpen;wasCloudOpen=cloudOpen;
  watch();
  return !!(op||cloud);
}
function schedule(ms){clearTimeout(timer);timer=setTimeout(sync,ms==null?30:ms)}
function watchOne(m,current){
  if(!m)return current;
  if(current&&current.__target===m)return current;
  if(current)try{current.disconnect()}catch(e){}
  const o=new MutationObserver(()=>schedule(20));o.__target=m;o.observe(m,{attributes:true,attributeFilter:['class']});return o;
}
function watch(){obsOp=watchOne(opModal(),obsOp);obsCloud=watchOne(cloudModal(),obsCloud)}
function watchRoot(){
  if(rootObserver||!document.documentElement)return;
  rootObserver=new MutationObserver(()=>{if($('dfOpModal')||$('dfCloudViewer')){watch();schedule(20)}});
  rootObserver.observe(document.documentElement,{childList:true,subtree:true});
}
function boot(){addStyle();watchRoot();sync();setTimeout(sync,350);setTimeout(sync,1200)}

document.addEventListener('click',function(e){
  const t=e.target&&e.target.closest?e.target.closest('[data-view],#dfCloseModal,#dfFixSave,#dfCloudClose,[data-cloud-open]'):null;
  if(t){setTimeout(sync,20);setTimeout(sync,180)}
},true);
window.addEventListener('df-ui-ready',()=>setTimeout(sync,120));
window.addEventListener('pageshow',()=>setTimeout(sync,80));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(sync,80)});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
