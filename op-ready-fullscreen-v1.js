(function(){
'use strict';
if(window.DFReadyFullScreenV1)return;window.DFReadyFullScreenV1=true;
function init(){
 var pane=document.getElementById('dfPaneOk'),tabs=document.querySelector('.dfOpsTabs');
 if(!pane||!tabs)return false;
 if(document.getElementById('dfReadyFullClose'))return true;
 var style=document.createElement('style');style.id='dfReadyFullStyle';style.textContent=`
 body.df-ready-full #dfPaneOk{display:block!important;position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;max-height:100dvh!important;overflow-y:auto!important;overscroll-behavior:contain!important;background:#080b13!important;z-index:10000!important;padding:70px 12px 24px!important;box-sizing:border-box!important;-webkit-overflow-scrolling:touch!important}
 body.df-ready-full #dfPaneOk>.dfOpsCard{padding:10px!important;background:transparent!important;border:0!important;margin:0!important}
 body.df-ready-full #dfPaneOk>.dfOpsCard>h3{display:none!important}
 #dfReadyFullTop{display:none;position:fixed;top:0;left:0;right:0;z-index:10002;background:#080b13;border-bottom:1px solid #334155;padding:calc(env(safe-area-inset-top,0px) + 8px) 12px 10px;align-items:center;gap:12px;min-height:52px;box-sizing:border-box}
 body.df-ready-full #dfReadyFullTop{display:flex}
 #dfReadyFullClose{border:1px solid #f5a000;border-radius:10px;background:#241600;color:#ffd36a;font-weight:800;padding:10px 12px;flex-shrink:0}
 #dfReadyFullTop strong{color:#fff;font-size:16px}
 body.df-ready-full #dfProductHistoryBox{position:sticky!important;top:0!important;z-index:2!important;background:#0b1220!important;margin:0 0 12px!important;padding:12px!important;border:1px solid #334155!important;border-radius:14px!important}
 body.df-ready-full #dfProductHistoryBox h4,body.df-ready-full #dfProductHistoryBox .dfPhSub{display:none!important}
 body.df-ready-full #dfProductHistorySearch{font-size:16px!important;min-height:48px!important}
 body.df-ready-full #dfProductHistoryResults{max-height:35vh;overflow-y:auto;overscroll-behavior:contain}
 body.df-ready-full #dfOpModal,body.df-ready-full #dfCloudViewer{z-index:11000!important}
 `;document.head.appendChild(style);
 var top=document.createElement('div');top.id='dfReadyFullTop';top.innerHTML='<button id="dfReadyFullClose" type="button">← VOLTAR</button><strong>✅ OPs PRONTAS</strong>';document.body.appendChild(top);
 function close(){document.body.classList.remove('df-ready-full');var input=document.getElementById('dfProductHistorySearch');if(input)input.blur()}
 top.querySelector('button').addEventListener('click',function(){close();var read=tabs.querySelector('[data-pane="read"]');if(read)read.click()});
 tabs.addEventListener('click',function(e){var b=e.target.closest('[data-pane]');if(!b)return;if(b.dataset.pane==='ok'){document.body.classList.add('df-ready-full');pane.scrollTop=0}else close()},true);
 document.getElementById('dfFormTabCore')?.addEventListener('click',close,true);
 window.addEventListener('popstate',close);
 return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){if(!init()){var n=0,t=setInterval(function(){if(init()||++n>40)clearInterval(t)},250)}});else if(!init()){var n=0,t=setInterval(function(){if(init()||++n>40)clearInterval(t)},250)}
})();