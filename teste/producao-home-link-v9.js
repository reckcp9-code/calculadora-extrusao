(function(){
'use strict';
if(window.DFProducaoHomeLinkV9)return;window.DFProducaoHomeLinkV9=true;
const DEST='../op-producao-teste-v9.html?v=20261003-home-v9';
function go(e){if(e){try{e.preventDefault()}catch(_e){}try{e.stopPropagation()}catch(_e){}try{e.stopImmediatePropagation()}catch(_e){}}location.href=DEST}
function install(){
  const tabs=document.querySelector('.tabs');if(!tabs)return false;
  let b=document.getElementById('btPr');
  if(!b){b=document.createElement('button');b.id='btPr';b.className='tab';b.type='button';b.textContent='PRODUÇÃO';tabs.appendChild(b)}
  b.onclick=go;
  b.setAttribute('aria-label','Produção — OP semanal');
  return true;
}
document.addEventListener('click',function(e){const t=e.target&&e.target.closest?e.target.closest('#btPr'):null;if(t)go(e)},true);
function boot(){if(install())return;let k=0,t=setInterval(()=>{if(install()||++k>60)clearInterval(t)},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('df-ui-ready',()=>setTimeout(boot,80));
})();