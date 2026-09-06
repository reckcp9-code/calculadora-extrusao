(function(){
  'use strict';
  function style(){
    if(document.getElementById('dfOfflineStyle'))return;
    const s=document.createElement('style');s.id='dfOfflineStyle';
    s.textContent='.dfOfflineBanner{display:none;margin:-4px 0 12px;padding:10px 12px;border:1px solid #f59e0b;border-radius:13px;background:#2a1902;color:#fde68a;font:800 12px system-ui;line-height:1.35}.dfOfflineBanner.on{display:block}.dfNetBadge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font:900 10px system-ui;border:1px solid #334155;background:#0f172a;color:#cbd5e1}.dfNetBadge.off{border-color:#f59e0b;background:#2a1902;color:#fde68a}.dfNetDot{width:7px;height:7px;border-radius:50%;background:#22c55e}.dfNetBadge.off .dfNetDot{background:#f59e0b}';
    document.head.appendChild(s);
  }
  function ensure(){
    style();
    try{if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(r=>{const t=r.active||r.waiting||r.installing;if(t)t.postMessage({type:'DF_CACHE_NOW'})}).catch(()=>{})}catch(e){}
    let b=document.getElementById('dfOfflineBanner');
    if(!b){b=document.createElement('div');b.id='dfOfflineBanner';b.className='dfOfflineBanner';b.innerHTML='<b>MODO OFFLINE</b> — materiais e formulações salvos continuam disponíveis. OP/PDF salvos podem ser consultados; cálculos que dependem do servidor ficam pausados até a internet voltar.';const bar=document.getElementById('dfSystemBar');if(bar&&bar.parentNode)bar.parentNode.insertBefore(b,bar.nextSibling);}
    let badge=document.getElementById('dfNetBadge');
    if(!badge){badge=document.createElement('span');badge.id='dfNetBadge';badge.className='dfNetBadge';badge.innerHTML='<span class="dfNetDot"></span><span class="dfNetTxt">ONLINE</span>';const a=document.querySelector('#dfSystemBar .dfSystemActions');if(a)a.insertBefore(badge,a.firstChild);}
    update();
  }
  function update(){
    const off=navigator.onLine===false,b=document.getElementById('dfOfflineBanner'),badge=document.getElementById('dfNetBadge');
    if(b)b.classList.toggle('on',off);
    if(badge){badge.classList.toggle('off',off);const t=badge.querySelector('.dfNetTxt');if(t)t.textContent=off?'OFFLINE':'ONLINE';}
    document.documentElement.dataset.dfOnline=off?'0':'1';
    window.dispatchEvent(new CustomEvent('df-network-state',{detail:{online:!off}}));
    if(!off&&typeof window.dfBackupSync==='function')setTimeout(()=>window.dfBackupSync(),500);
  }
  window.addEventListener('online',update);window.addEventListener('offline',update);
  window.addEventListener('df-offline-auth',()=>setTimeout(ensure,20));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(ensure,350);setTimeout(ensure,1200)});else{setTimeout(ensure,350);setTimeout(ensure,1200)}
})();
