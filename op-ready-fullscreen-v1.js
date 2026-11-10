(function(){
'use strict';
if(window.DFReadyFullScreenV1)return;window.DFReadyFullScreenV1=true;
const $=id=>document.getElementById(id);
function addStyle(){
 if($('dfReadyFullStyle'))return;
 const style=document.createElement('style');style.id='dfReadyFullStyle';
 style.textContent=[
  'body.df-ready-full #dfPaneOk{display:block!important;position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;max-height:100dvh!important;overflow-y:auto!important;overscroll-behavior:contain!important;background:#080b13!important;z-index:10000!important;padding:calc(env(safe-area-inset-top,0px) + 78px) 12px 24px!important;box-sizing:border-box!important;-webkit-overflow-scrolling:touch!important}',
  'body.df-ready-full #dfPaneOk>.dfOpsCard{padding:10px!important;background:transparent!important;border:0!important;margin:0!important}',
  'body.df-ready-full #dfPaneOk>.dfOpsCard>h3{display:none!important}',
  '#dfReadyFullTop{display:none;position:fixed;top:0;left:0;right:0;z-index:10002;background:#080b13;border-bottom:1px solid #334155;padding:calc(env(safe-area-inset-top,0px) + 8px) 12px 10px;align-items:center;gap:12px;min-height:52px;box-sizing:border-box}',
  'body.df-ready-full #dfReadyFullTop{display:flex!important}',
  '#dfReadyFullClose{border:1px solid #f5a000;border-radius:10px;background:#241600;color:#ffd36a;font-weight:800;padding:10px 12px;flex-shrink:0}',
  '#dfReadyFullTop strong{color:#fff;font-size:16px}',
  'body.df-ready-full #dfProductHistoryBox{position:sticky!important;top:0!important;z-index:2!important;background:#0b1220!important;margin:0 auto 12px!important;padding:14px!important;border:1px solid #334155!important;border-radius:14px!important;box-sizing:border-box!important;width:100%!important;max-width:680px!important}',
  'body.df-ready-full #dfProductHistoryBox h4,body.df-ready-full #dfProductHistoryBox .dfPhSub{display:none!important}',
  'body.df-ready-full #dfProductHistorySearch{font-size:16px!important;min-height:48px!important;width:100%!important;box-sizing:border-box!important}',
  'body.df-ready-full #dfProductHistoryResults{max-height:none!important;overflow:visible!important;overscroll-behavior:contain!important}',
  'body.df-ready-full #dfPaneOk .dfPhSearchLine{width:100%!important;box-sizing:border-box!important}',
  'body.df-ready-full #dfPaneOk .dfPhSearchLine button{width:100%!important;min-height:42px!important}',
  'body.df-ready-full #dfPaneOk #dfOkList{max-width:680px;margin:0 auto}',
  'body.df-ready-full #dfPaneOk{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 28px)!important}',
  'body.df-ready-full #dfPaneOk .dfOpsCard{min-height:calc(100dvh - 110px)!important}',
  'body.df-ready-full #dfPaneOk .dfFormulaReadyCard{padding:10px!important;background:#111827!important;border:1px solid #29364a!important;border-radius:12px!important;margin:8px auto!important;max-width:680px!important}',
  'body.df-ready-full #dfPaneOk .dfFormulaReadyHead{display:flex;justify-content:space-between;gap:9px;align-items:flex-start}',
  'body.df-ready-full #dfPaneOk .dfFormulaReadyHead strong{display:block;color:#ffd36a;font-size:14px;line-height:1.3;overflow-wrap:anywhere}',
  'body.df-ready-full #dfPaneOk .dfFormulaReadyHead small{display:block;color:#94a3b8;font-size:10px;margin-top:3px;overflow-wrap:anywhere}',
  'body.df-ready-full #dfPaneOk .dfFormulaReadyBadge{background:#064e2b;color:#86efac;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:900;white-space:nowrap}',
  'body.df-ready-full #dfPaneOk .dfFormulaReadyMeta{color:#cbd5e1;font-size:11px;line-height:1.5;margin:8px 0}',
  'body.df-ready-full #dfPaneOk .dfFormulaReadyCard>.dfOpsBtn{min-height:40px;margin-top:6px}',
  'body.df-ready-full #dfPaneOk .dfFormulaReadyDetails{margin-top:7px;color:#94a3b8}',
  'body.df-ready-full #dfPaneOk .dfFormulaReadyDetails summary{cursor:pointer;padding:7px 4px;font-size:11px;font-weight:800;list-style:disclosure-closed}',
  'body.df-ready-full #dfPaneOk .dfFormulaReadyDetails[open] summary{list-style:disclosure-open}',
  'body.df-ready-full #dfPaneOk .dfFormulaReadyExtra{padding:10px;color:#cbd5e1;font-size:13px;line-height:1.7}',
  'body.df-ready-full #dfPaneOk #dfProductHistoryBox{margin-top:0!important;margin-bottom:8px!important;padding:10px!important}',
  'body.df-ready-full #dfPaneOk>#dfProductHistoryBox{position:sticky!important;top:0!important;z-index:12!important;overflow-anchor:none!important}',
  'body.df-ready-full #dfPaneOk #dfOkList{overflow-anchor:none!important}',
  'body.df-ready-full #dfPaneOk #dfProductHistoryResults{margin-top:8px!important}',
  'body.df-ready-full #dfPaneOk .dfPhSummary div{padding:8px!important}',
  'body.df-ready-full #dfPaneOk #dfProductHistoryBox .dfPhSearchLine{grid-template-columns:1fr!important}',
  'body.df-ready-full #dfPaneOk #dfProductHistoryBtn{min-height:48px!important}',
  'body.df-ready-full #dfPaneOk #dfProductHistorySearch{min-height:50px!important}',
  'body.df-ready-full #dfPaneOk #dfProductHistoryBox .dfPhHint{font-size:12px!important}',
  
  'body.df-ready-full #dfOpModal,body.df-ready-full #dfCloudViewer{z-index:11000!important}'
 ].join('\n');
 document.head.appendChild(style);
}
function ensure(){
 const pane=$('dfPaneOk'),tabs=document.querySelector('#dfFormulaOps .dfOpsTabs');
 if(!pane||!tabs)return false;
 addStyle();
 let top=$('dfReadyFullTop');
 if(!top){
  top=document.createElement('div');top.id='dfReadyFullTop';
  top.innerHTML='<button id="dfReadyFullClose" type="button">← VOLTAR</button><strong>✅ OPs PRONTAS</strong>';
  document.body.appendChild(top);
 }else if(!$('dfReadyFullClose')){
  top.innerHTML='<button id="dfReadyFullClose" type="button">← VOLTAR</button><strong>✅ OPs PRONTAS</strong>';
 }
 return true;
}
function arrangeReadyOptions(){
 const pane=$('dfPaneOk');if(!pane)return;
 pane.querySelectorAll('#dfOkList .dfFormulaReadyCard').forEach(row=>{
  const details=row.querySelector('.dfFormulaReadyDetails');if(!details)return;
  // Controles adicionados por outros módulos permanecem funcionais,
  // mas ficam recolhidos como na lista de Produção.
  row.querySelectorAll('[data-life-delete-op],[data-op-history],[data-history-op],.dfOpHistoryBtn').forEach(btn=>{
   if(!details.contains(btn))details.appendChild(btn);
  });
  row.querySelectorAll('button').forEach(btn=>{
   if(/hist[oó]rico da op/i.test(btn.textContent||'')&&!details.contains(btn))details.appendChild(btn);
  });
  const next=row.nextElementSibling;
  if(next&&/hist[oó]rico da op/i.test(next.textContent||'')&&next.matches('button'))details.appendChild(next);
 });
}
function close(){document.body.classList.remove('df-ready-full');try{$('dfProductHistorySearch')?.blur()}catch(e){}}
function repair(){
 if(!ensure())return false;
 const pane=$('dfPaneOk'),tab=document.querySelector('#dfFormulaOps .dfOpsTabs [data-pane="ok"]');
 const visible=$('dfFormulaOps')?.classList.contains('on')&&pane?.classList.contains('on')&&tab?.classList.contains('on');
 if(visible){document.body.classList.add('df-ready-full');arrangeReadyOptions()}else close();
 return visible;
}
function boot(){
 ensure();
 document.addEventListener('click',e=>{
  const target=e.target;
  if(!target?.closest)return;
  if(target.closest('#dfReadyFullClose')){
   e.preventDefault();e.stopPropagation();close();
   document.querySelector('#dfFormulaOps .dfOpsTabs [data-pane="read"]')?.click();return;
  }
  const tab=target.closest('#dfFormulaOps .dfOpsTabs [data-pane]');
  if(tab){if(tab.dataset.pane==='ok'){ensure();document.body.classList.add('df-ready-full')}else close();setTimeout(repair,55);return}
  if(target.closest('#dfMonthlyPhotoButton,#dfFormTabCore,#btFo,#dfFormTabOps')&&
     !target.closest('#dfFormulaOps .dfOpsTabs [data-pane="ok"]')){close();setTimeout(repair,70)}
 },true);
 for(const event of ['df-ui-ready','df-formula-section-entered','pageshow','df-op-d1-applied'])
  window.addEventListener(event,()=>setTimeout(repair,110));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(repair,140)});
 window.addEventListener('popstate',close);
 // A restauração do modo PRONTAS não depende mais de somente 10 segundos de tentativas.
 setInterval(()=>{if(!document.hidden&&$('dfFormulaOps')?.classList.contains('on')){const expected=$('dfPaneOk')?.classList.contains('on');if(document.body.classList.contains('df-ready-full')!==!!expected)repair()}},8000);
 const readyList=$('dfOkList');if(readyList){let pending=false;const observer=new MutationObserver(mutations=>{if(!document.body.classList.contains('df-ready-full')||pending||!mutations.some(m=>m.type==='childList'&&m.addedNodes.length))return;pending=true;requestAnimationFrame(()=>{pending=false;arrangeReadyOptions()})});observer.observe(readyList,{childList:true,subtree:false})}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();