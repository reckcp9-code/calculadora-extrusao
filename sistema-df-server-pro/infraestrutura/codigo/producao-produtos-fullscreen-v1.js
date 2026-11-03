(function(){
'use strict';
if(window.DF_PRODUCAO_PRODUTOS_FULLSCREEN_V1)return;window.DF_PRODUCAO_PRODUTOS_FULLSCREEN_V1=true;

function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function isProductModal(m){return !!m&&norm(m.querySelector('.dfRegHead b')?.textContent).includes('produtos cadastrados')}
function apply(){
  const m=document.getElementById('dfRegModal');
  if(!m||!isProductModal(m))return;
  m.classList.add('dfProductsFullScreen');
}
function css(){
  if(document.getElementById('dfProductsFullScreenCss'))return;
  const s=document.createElement('style');s.id='dfProductsFullScreenCss';s.textContent=`
#dfRegModal.dfProductsFullScreen{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:100vh!important;padding:0!important;align-items:stretch!important;justify-content:stretch!important;background:#111827!important;backdrop-filter:none!important}
#dfRegModal.dfProductsFullScreen .dfRegPanel{width:100vw!important;max-width:none!important;height:100dvh!important;min-height:100vh!important;max-height:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding-top:max(8px,env(safe-area-inset-top))!important;padding-bottom:max(8px,env(safe-area-inset-bottom))!important;background:#111827!important}
#dfRegModal.dfProductsFullScreen .dfRegHead{flex:0 0 auto!important;padding:16px 18px 12px!important}
#dfRegModal.dfProductsFullScreen .dfRegSearch,#dfRegModal.dfProductsFullScreen .dfRegMeta,#dfRegModal.dfProductsFullScreen .dfRegAdd{flex:0 0 auto!important}
#dfRegModal.dfProductsFullScreen .dfRegList{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding-bottom:max(18px,env(safe-area-inset-bottom))!important}
#dfRegModal.dfProductsFullScreen .dfRegX{position:relative!important;z-index:2!important}
`;
  document.head.appendChild(s)
}
function start(){
  css();apply();
  const root=document.body||document.documentElement;
  new MutationObserver(records=>{
    if(records.some(r=>[...r.addedNodes].some(n=>n&&n.nodeType===1&&(n.id==='dfRegModal'||n.querySelector?.('#dfRegModal')))))requestAnimationFrame(apply);
  }).observe(root,{childList:true});
  document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('[data-df-picker="product"]'))setTimeout(apply,0)},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
