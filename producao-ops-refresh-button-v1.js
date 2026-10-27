(function(){'use strict';
if(window.DF_PROD_OP_REFRESH_BUTTON_V1)return;window.DF_PROD_OP_REFRESH_BUTTON_V1=true;
var busy=false;

var FILTER_KEY='df_producao_ops_turno_filtro_v1';
function turnoAtual(){try{return localStorage.getItem(FILTER_KEY)||'Todos'}catch(e){return'Todos'}}
function turnoDaOp(id){try{var a=JSON.parse(localStorage.getItem('df_producao_ops_setores_test_v3')||'[]');var op=Array.isArray(a)&&a.find(function(x){return String(x.id||'').toUpperCase()===id});if(!op)return'';var v=String(op.shift||'').trim();return ({'00:00–07:00':'1','07:00–15:30':'2','15:30–00:00':'3'})[v]||v.replace(/[^123]/g,'').slice(0,1)}catch(e){return''}}
function aplicarTurno(){var bar=document.getElementById('dfProdTurnoFilter');if(!bar)return;var card=bar.closest('section,article,.card,.panel')||bar.parentElement?.parentElement;if(!card)return;var selected=turnoAtual();bar.querySelectorAll('[data-turno]').forEach(function(b){var on=b.dataset.turno===selected;b.style.background=on?'#251800':'#101827';b.style.borderColor=on?'#f5a000':'#41516a';b.style.color=on?'#ffd36a':'#cbd5e1'});var nodes=card.querySelectorAll('*');var seen=new Set();nodes.forEach(function(n){if(n.children.length>0)return;var t=(n.textContent||'').trim();var m=t.match(/DFOP-\d{8}-\d{6}-[A-Z0-9]+/i);if(!m)return;var id=m[0].toUpperCase();if(seen.has(id))return;seen.add(id);var item=n;for(var k=0;k<5&&item.parentElement&&item.parentElement!==card;k++){if(item.parentElement.querySelectorAll('[data-turno],input').length)break;item=item.parentElement;if(item.parentElement?.querySelectorAll('[data-turno]').length)break;}if(item===card)return;var shift=turnoDaOp(id);item.style.display=(selected==='Todos'||shift===selected||!shift)?'':'none'})}
function montarTurnos(){var fav=findFavorites();if(!fav)return;var bar=document.getElementById('dfProdTurnoFilter');if(!bar){bar=document.createElement('div');bar.id='dfProdTurnoFilter';bar.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin:12px 0';['Todos','1','2','3'].forEach(function(t){var b=document.createElement('button');b.type='button';b.dataset.turno=t;b.textContent=t==='Todos'?'TODOS':'TURNO '+t;b.style.cssText='border:1px solid #41516a;border-radius:20px;padding:9px 12px;font:800 12px system-ui;cursor:pointer';b.addEventListener('click',function(){try{localStorage.setItem(FILTER_KEY,t)}catch(e){}aplicarTurno()});bar.appendChild(b)});var anchor=document.getElementById('dfProdRefreshOpsBtn')||fav;anchor.parentElement.insertAdjacentElement('afterend',bar)}aplicarTurno()}

function findFavorites(){return Array.from(document.querySelectorAll('button,[role="button"]')).find(function(el){return /favoritas/i.test((el.textContent||'').trim())&&el.offsetParent!==null})}
function mount(){var favorite=findFavorites();if(!favorite)return;if(document.getElementById('dfProdRefreshOpsBtn')){montarTurnos();return;}
var btn=document.createElement('button');btn.type='button';btn.id='dfProdRefreshOpsBtn';btn.textContent='↻ ATUALIZAR';btn.setAttribute('aria-label','Atualizar OPs da equipe');
btn.style.cssText='border:1.5px solid #3b82f6;background:#102445;color:#bfdbfe;border-radius:999px;padding:10px 14px;font:800 13px system-ui;cursor:pointer;min-height:40px;white-space:nowrap';
favorite.insertAdjacentElement('afterend',btn);montarTurnos();
btn.addEventListener('click',async function(){if(busy)return;busy=true;btn.disabled=true;btn.textContent='↻ SINCRONIZANDO...';
try{if(!navigator.onLine)throw new Error('Sem conexão com a internet');var api=window.DFProducaoEquipeOnline;if(!api||typeof api.pull!=='function'||!api.team||!api.team())throw new Error('Entre na equipe de Produção para sincronizar');
var result=await api.pull();if(result===false)throw new Error('Não foi possível confirmar a atualização');
if(typeof window.DFRenderSavedProductionOps==='function')window.DFRenderSavedProductionOps();setTimeout(aplicarTurno,100);
btn.textContent='✓ ATUALIZADO';setTimeout(function(){btn.textContent='↻ ATUALIZAR'},1800);
}catch(err){btn.textContent='↻ ATUALIZAR';alert('Não foi possível atualizar as OPs: '+(err&&err.message||'erro de conexão'));}finally{busy=false;btn.disabled=false}});
}
var timer;function queue(){clearTimeout(timer);timer=setTimeout(mount,120)}
function boot(){mount();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();