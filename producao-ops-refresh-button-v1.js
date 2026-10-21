(function(){'use strict';
if(window.DF_PROD_OP_REFRESH_BUTTON_V1)return;window.DF_PROD_OP_REFRESH_BUTTON_V1=true;
var busy=false;
function findFavorites(){return Array.from(document.querySelectorAll('button,[role="button"]')).find(function(el){return /favoritas/i.test((el.textContent||'').trim())&&el.offsetParent!==null})}
function mount(){var favorite=findFavorites();if(!favorite||document.getElementById('dfProdRefreshOpsBtn'))return;
var btn=document.createElement('button');btn.type='button';btn.id='dfProdRefreshOpsBtn';btn.textContent='↻ ATUALIZAR';btn.setAttribute('aria-label','Atualizar OPs da equipe');
btn.style.cssText='border:1.5px solid #3b82f6;background:#102445;color:#bfdbfe;border-radius:999px;padding:10px 14px;font:800 13px system-ui;cursor:pointer;min-height:40px;white-space:nowrap';
favorite.insertAdjacentElement('afterend',btn);
btn.addEventListener('click',async function(){if(busy)return;busy=true;btn.disabled=true;btn.textContent='↻ SINCRONIZANDO...';
try{if(!navigator.onLine)throw new Error('Sem conexão com a internet');var api=window.DFProducaoEquipeOnline;if(!api||typeof api.pull!=='function'||!api.team||!api.team())throw new Error('Entre na equipe de Produção para sincronizar');
var result=false;
for(var attempt=0;attempt<5;attempt++){
result=await api.pull();
if(result===true)break;
await new Promise(function(resolve){setTimeout(resolve,650+attempt*450)});
}
if(result!==true)throw new Error('Servidor não confirmou a sincronização. Verifique a conexão e tente novamente.');
if(typeof window.DFRenderSavedProductionOps==='function')window.DFRenderSavedProductionOps();
btn.textContent='✓ ATUALIZADO';setTimeout(function(){btn.textContent='↻ ATUALIZAR'},1800);
}catch(err){btn.textContent='↻ ATUALIZAR';alert('Não foi possível atualizar as OPs: '+(err&&err.message||'erro de conexão'));}finally{busy=false;btn.disabled=false}});
}
var timer;function queue(){clearTimeout(timer);timer=setTimeout(mount,120)}
function boot(){mount();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();