(function(){
'use strict';
if(window.DFProductionFinalizeBroadcastV175)return;
window.DFProductionFinalizeBroadcastV175=true;

var retryTimer=0;
function paneOpen(){var p=document.getElementById('dfPaneNow');return !!(p&&p.classList.contains('on'))}
function api(){return window.DFNowCloudBridgeV169Api||null}
function call(name){var a=api();if(!a||typeof a[name]!=='function')return false;try{a[name]();return true}catch(e){return false}}
function whenReady(name,attempt){attempt=attempt||0;if(call(name))return;if(attempt>=12)return;clearTimeout(retryTimer);retryTimer=setTimeout(function(){whenReady(name,attempt+1)},250)}
function uploadNow(){whenReady('upload',0)}
function syncNow(){whenReady('sync',0)}

/*
  O botão real do Produção Agora usa data-now-done.
  Ao finalizar, força a publicação do novo estado para a equipe em mais de uma janela,
  evitando depender apenas do ciclo periódico do bridge.
*/
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('[data-now-done]'):null;
  if(!b)return;
  setTimeout(uploadNow,120);
  setTimeout(uploadNow,900);
  setTimeout(uploadNow,2600);
},true);

/* Operadores consultam a nuvem com mais frequência enquanto a tela AGORA estiver aberta. */
document.addEventListener('click',function(e){
  var t=e.target&&e.target.closest?e.target.closest('#dfNowTab,[data-pane="now"]'):null;
  if(t)setTimeout(syncNow,120);
},true);
window.addEventListener('pageshow',function(){setTimeout(syncNow,180)});
window.addEventListener('online',function(){setTimeout(function(){uploadNow();syncNow()},250)});
document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(syncNow,180)});
setInterval(function(){if(!document.hidden&&paneOpen())syncNow()},5000);
})();
