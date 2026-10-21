(function(){'use strict';
if(window.DF_HOME_PROD_REFRESH_V1)return;window.DF_HOME_PROD_REFRESH_V1=true;
var working=false;
function mount(){if(document.getElementById('dfHomeProdRefresh'))return;
var prod=Array.from(document.querySelectorAll('button,a,[role="button"]')).find(function(e){return (e.textContent||'').trim().toUpperCase()==='PRODUÇÃO'&&e.offsetParent!==null});
if(!prod)return;
var btn=document.createElement('button');btn.id='dfHomeProdRefresh';btn.type='button';btn.textContent='↻ ATUALIZAR';
btn.style.cssText='min-height:52px;padding:10px 14px;border-radius:14px;border:2px solid #2563eb;background:#102445;color:#bfdbfe;font:800 13px system-ui;cursor:pointer;flex:1;min-width:0';
var wrap=document.createElement('div');wrap.style.cssText='display:flex;gap:8px;align-items:stretch;width:100%;margin:6px 0';prod.parentNode.insertBefore(wrap,prod);wrap.appendChild(prod);wrap.appendChild(btn);prod.style.flex='2';prod.style.minWidth='0';
btn.onclick=function(){if(working)return;if(!navigator.onLine)return alert('Sem internet. Conecte-se para atualizar as OPs.');working=true;btn.disabled=true;btn.textContent='↻ SINCRONIZANDO...';
var frame=document.createElement('iframe');frame.style.cssText='position:absolute;width:1px;height:1px;opacity:0;pointer-events:none';frame.setAttribute('aria-hidden','true');frame.src='./op-producao.html?dfHomeSync=1';document.body.appendChild(frame);
var done=false;var timeout=setTimeout(function(){finish(false,'Tempo limite de sincronização')},25000);
function finish(ok,msg){if(done)return;done=true;clearTimeout(timeout);window.removeEventListener('message',receive);frame.remove();working=false;btn.disabled=false;btn.textContent=ok?'✓ ATUALIZADO':'↻ ATUALIZAR';if(!ok)alert('Não foi possível atualizar as OPs: '+msg);else setTimeout(function(){btn.textContent='↻ ATUALIZAR'},2000)}
function receive(e){if(e.origin!==location.origin||e.source!==frame.contentWindow||!e.data||e.data.type!=='DF_HOME_PROD_SYNC_RESULT')return;finish(e.data.ok,e.data.message||'Falha na sincronização')}
window.addEventListener('message',receive);
};}
var timer;function boot(){mount();new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(mount,250)}).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();