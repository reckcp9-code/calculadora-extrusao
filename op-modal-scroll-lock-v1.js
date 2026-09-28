(function(){
'use strict';
if(window.DFOpModalScrollLockV2)return;window.DFOpModalScrollLockV2=true;

let locked=false,scrollY=0,timer=0,rootObserver=null;
let obsOp=null,obsCloud=null,wasOpOpen=false,wasCloudOpen=false;
let bodyPrev=null;
const $=id=>document.getElementById(id);

function addStyle(){
  if($('dfOpModalScrollLockStyleV2'))return;
  const s=document.createElement('style');s.id='dfOpModalScrollLockStyleV2';s.textContent=`
#dfOpModal,#dfCloudViewer{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-width:none!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important;box-sizing:border-box!important;transform:none!important;background:rgba(2,6,23,.985)!important}
#dfOpModal{z-index:2147483000!important;padding:12px!important}
#dfCloudViewer{z-index:2147483100!important;padding:max(10px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom))!important}
#dfOpModal .dfOpModalBox,#dfCloudViewer .box{position:relative!important;max-width:760px!important;margin:0 auto!important;min-height:auto!important;transform:none!important}
#dfOpModal #dfCloseModal,#dfCloudViewer #dfCloudClose{position:sticky!important;top:0!important;z-index:20!important;margin:0 0 10px!important;box-shadow:0 8px 20px rgba(2,6,23,.92)!important}
#dfCloudViewerBody img{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:calc(100dvh - 175px)!important;object-fit:contain!important}
html.dfOpModalLocked,body.dfOpModalLocked{overscroll-behavior:none!important}
body.dfOpModalLocked{overflow:hidden!important}
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
  const b=document.body;
  bodyPrev={position:b.style.position,top:b.style.top,left:b.style.left,right:b.style.right,width:b.style.width,overflow:b.style.overflow};
  document.documentElement.classList.add('dfOpModalLocked');b.classList.add('dfOpModalLocked');
  b.style.position='fixed';b.style.top=(-scrollY)+'px';b.style.left='0';b.style.right='0';b.style.width='100%';b.style.overflow='hidden';
}
function unlock(){
  if(!locked)return;locked=false;
  const b=document.body,p=bodyPrev||{};
  document.documentElement.classList.remove('dfOpModalLocked');b.classList.remove('dfOpModalLocked');
  b.style.position=p.position||'';b.style.top=p.top||'';b.style.left=p.left||'';b.style.right=p.right||'';b.style.width=p.width||'';b.style.overflow=p.overflow||'';
  bodyPrev=null;
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
