(function(){'use strict';
if(window.DF_PROD_OP_REFRESH_BUTTON_V1)return;window.DF_PROD_OP_REFRESH_BUTTON_V1=true;
var busy=false;

var FILTER_KEY='df_producao_ops_turno_filtro_v1';
function turnoAtual(){try{return localStorage.getItem(FILTER_KEY)||'Todos'}catch(e){return'Todos'}}
function turnoDaOp(id){try{var a=JSON.parse(localStorage.getItem('df_producao_ops_setores_test_v3')||'[]');var op=Array.isArray(a)&&a.find(function(x){return String(x.id||'').toUpperCase()===id});if(!op)return'';var v=String(op.shift||'').trim();return ({'00:00–07:00':'1','07:00–15:30':'2','15:30–00:00':'3'})[v]||v.replace(/[^123]/g,'').slice(0,1)}catch(e){return''}}
function aplicarTurno(){
 var fav=findFavorites(), selected=turnoAtual();if(!fav)return;
 
 var root=fav.closest('section,article,.card,.panel')||fav.parentElement?.parentElement?.parentElement?.parentElement;if(!root)return;
 var ops=[];root.querySelectorAll('*').forEach(function(n){if(n.children.length||!n.textContent)return;var m=n.textContent.trim().match(/DFOP-\d{8}-\d{6}-[A-Z0-9]+/i);if(!m)return;var item=n;for(var k=0;k<6&&item.parentElement&&item.parentElement!==root;k++){var p=item.parentElement;if(p.querySelectorAll('button').length>3||p.querySelectorAll('input').length)break;item=p}if(item!==root)ops.push({item:item,id:m[0].toUpperCase()})});
 ops.forEach(function(o){var shift=turnoDaOp(o.id);o.item.style.display=selected==='Todos'||shift===selected||!shift?'':'none'});
}
function montarTurnos(){
 var fav=findFavorites();if(!fav)return;
 var section=fav.closest('section,article,.card,.panel')||fav.parentElement?.parentElement?.parentElement;
 if(!section)return;
 var search=Array.from(section.querySelectorAll('input')).find(function(x){return /pesquisar op/i.test(x.placeholder||'')});
 if(!search)return;
 var anchor=search.closest('label,.search,.search-box,.input-group')||search.parentElement;
 var bar=document.getElementById('dfProdTurnoSelect');
 if(!bar){
  bar=document.createElement('select');bar.id='dfProdTurnoSelect';bar.setAttribute('aria-label','Filtrar OPs por turno');
  bar.style.cssText='display:block;width:100%;min-height:52px;margin:12px 0 14px;padding:12px 16px;border:1.5px solid #40516d;border-radius:14px;background:#101a2d;color:#f1f5f9;font:700 16px system-ui;box-sizing:border-box';
  [['Todos','Todas'],['1','Turno 1'],['2','Turno 2'],['3','Turno 3']].forEach(function(pair){var o=document.createElement('option');o.value=pair[0];o.textContent=pair[1];bar.appendChild(o)});
  bar.value=turnoAtual();bar.addEventListener('change',function(){try{localStorage.setItem(FILTER_KEY,bar.value)}catch(e){}aplicarTurno()});
 }
 if(anchor.nextElementSibling!==bar)anchor.insertAdjacentElement('afterend',bar);
 var parent=fav.parentElement;
 if(parent)Array.from(parent.querySelectorAll('button')).forEach(function(btn){if(btn!==fav&&(/^(todas|todos|turno [123])$/i.test((btn.textContent||'').trim())||btn.id==='dfProdRefreshOpsBtn'))btn.style.display='none'});
 aplicarTurno();
}

function findFavorites(){return Array.from(document.querySelectorAll('button,[role="button"]')).find(function(el){return /favoritas/i.test((el.textContent||'').trim())&&el.offsetParent!==null})}
function mount(){montarTurnos()}

var timer;function queue(){clearTimeout(timer);timer=setTimeout(mount,120)}
function boot(){mount();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();