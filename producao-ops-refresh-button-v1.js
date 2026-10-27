(function(){'use strict';
if(window.DF_PROD_OP_REFRESH_BUTTON_V1)return;window.DF_PROD_OP_REFRESH_BUTTON_V1=true;
var busy=false;

var FILTER_KEY='df_producao_ops_turno_filtro_v1';
function turnoAtual(){try{return localStorage.getItem(FILTER_KEY)||'Todos'}catch(e){return'Todos'}}
function turnoDaOp(id){try{var a=JSON.parse(localStorage.getItem('df_producao_ops_setores_test_v3')||'[]');var op=Array.isArray(a)&&a.find(function(x){return String(x.id||'').toUpperCase()===id});if(!op)return'';var v=String(op.shift||'').trim();return ({'00:00–07:00':'1','07:00–15:30':'2','15:30–00:00':'3'})[v]||v.replace(/[^123]/g,'').slice(0,1)}catch(e){return''}}
function aplicarTurno(){
 var fav=findFavorites(), selected=turnoAtual();if(!fav)return;
 document.querySelectorAll('[data-df-turno]').forEach(function(b){var on=b.dataset.dfTurno===selected;b.style.background=on?'#251800':'#101827';b.style.borderColor=on?'#f5a000':'#41516a';b.style.color=on?'#ffd36a':'#cbd5e1'});
 var root=fav.closest('section,article,.card,.panel')||fav.parentElement?.parentElement?.parentElement?.parentElement;if(!root)return;
 var ops=[];root.querySelectorAll('*').forEach(function(n){if(n.children.length||!n.textContent)return;var m=n.textContent.trim().match(/DFOP-\d{8}-\d{6}-[A-Z0-9]+/i);if(!m)return;var item=n;for(var k=0;k<6&&item.parentElement&&item.parentElement!==root;k++){var p=item.parentElement;if(p.querySelectorAll('button').length>3||p.querySelectorAll('input').length)break;item=p}if(item!==root)ops.push({item:item,id:m[0].toUpperCase()})});
 ops.forEach(function(o){var shift=turnoDaOp(o.id);o.item.style.display=selected==='Todos'||shift===selected||!shift?'':'none'});
}
function montarTurnos(){
 var fav=findFavorites();if(!fav)return;
 var parent=fav.parentElement;if(!parent)return;
 ['1','2','3'].forEach(function(t){var id='dfProdTurno'+t;var b=document.getElementById(id);if(!b){b=document.createElement('button');b.id=id;b.type='button';b.dataset.dfTurno=t;b.textContent='TURNO '+t;b.style.cssText='border:1.5px solid #41516a;border-radius:999px;background:#101827;color:#cbd5e1;padding:10px 12px;font:800 12px system-ui;min-height:40px;white-space:nowrap';b.addEventListener('click',function(){try{localStorage.setItem(FILTER_KEY,t)}catch(e){}aplicarTurno()});fav.insertAdjacentElement('afterend',b)}});
 if(!parent.dataset.dfTurnosStyled){parent.style.flexWrap='wrap';parent.dataset.dfTurnosStyled='1'}
 var all=Array.from(parent.querySelectorAll('button')).find(function(b){return b!==fav&&/^(todas|todos)$/i.test((b.textContent||'').trim())});if(all&&!all.dataset.dfTurnoBound){all.dataset.dfTurnoBound='1';all.addEventListener('click',function(){try{localStorage.setItem(FILTER_KEY,'Todos')}catch(e){}setTimeout(aplicarTurno,50)})}
 aplicarTurno();
}

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