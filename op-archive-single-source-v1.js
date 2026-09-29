(function(){
'use strict';
if(window.DFOpArchiveSingleSourceV1)return;window.DFOpArchiveSingleSourceV1=true;

let cardObserver=null,rowsObserver=null,timer=0;
const $=id=>document.getElementById(id);
const validQr=v=>/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim());

function addStyle(){
  if($('dfArchiveSingleStyle'))return;
  const s=document.createElement('style');s.id='dfArchiveSingleStyle';s.textContent=`
#dfPaneArchive .dfOpsCard{padding:12px!important}
#dfPaneArchive #dfCloudPhotosBox{margin-top:0!important}
#dfPaneArchive .dfCloudPhotoBtns{grid-template-columns:1fr 1fr!important}
#dfPaneArchive .dfArchiveHistoryBtn{grid-column:1/-1!important;border:1px solid #475569!important;background:#111827!important;color:#cbd5e1!important}
@media(max-width:430px){#dfPaneArchive .dfCloudPhotoBtns{grid-template-columns:1fr 1fr!important}}
`;
  document.head.appendChild(s);
}

function archiveCard(){return document.querySelector('#dfPaneArchive .dfOpsCard')}
function cloudBox(){return $('dfCloudPhotosBox')}

function removeLegacyChildren(){
  const card=archiveCard();if(!card)return false;
  const cloud=cloudBox();
  for(const ch of Array.from(card.children)){
    if(ch===cloud)continue;
    // Remove a lista antiga inteira: título, aviso local, backup ZIP e dfArchiveList.
    if(ch.id==='dfZipMonth'||ch.id==='dfArchiveList'||ch.tagName==='H3'||ch.classList?.contains('dfOpsTiny'))ch.remove();
  }
  return true;
}

function codeFromRow(row){
  const b=row?.querySelector('b,strong');
  const txt=String(b?.textContent||row?.textContent||'');
  const m=txt.match(/DFOP-\d{8}-\d{6}-[A-Z0-9-]+/i);
  return m?m[0].toUpperCase():'';
}

function decorateRows(){
  const host=$('dfCloudPhotosRows');if(!host)return false;
  host.querySelectorAll('.dfCloudPhotoRow').forEach(row=>{
    const id=codeFromRow(row);if(!validQr(id))return;
    let box=row.querySelector('.dfCloudPhotoBtns');if(!box)return;
    let h=box.querySelector('[data-history-op]');
    if(!h){
      h=document.createElement('button');h.type='button';h.className='dfCloudPhotoBtn dfArchiveHistoryBtn';h.dataset.historyOp=id;h.textContent='📜 HISTÓRICO DA OP';
      box.appendChild(h);
    }else h.dataset.historyOp=id;
  });
  return true;
}

function attach(){
  const card=archiveCard();
  if(card&&cardObserver?.__root!==card){
    try{cardObserver?.disconnect()}catch(e){}
    cardObserver=new MutationObserver(()=>schedule(40));cardObserver.__root=card;cardObserver.observe(card,{childList:true});
  }
  const host=$('dfCloudPhotosRows');
  if(host&&rowsObserver?.__root!==host){
    try{rowsObserver?.disconnect()}catch(e){}
    rowsObserver=new MutationObserver(()=>schedule(40));rowsObserver.__root=host;rowsObserver.observe(host,{childList:true});
  }
}

function apply(){addStyle();removeLegacyChildren();decorateRows();attach()}
function schedule(ms){clearTimeout(timer);timer=setTimeout(apply,ms==null?60:ms)}

function boot(){
  apply();
  setTimeout(apply,350);setTimeout(apply,900);setTimeout(apply,1600);
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="archive"],#dfCloudRefresh'))schedule(100)},true);
  window.addEventListener('df-ui-ready',()=>schedule(120));
  window.addEventListener('df-op-d1-applied',()=>schedule(120));
  window.addEventListener('pageshow',()=>schedule(120));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
