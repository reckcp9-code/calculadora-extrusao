(function(){
  const APP_VERSION='1.0.23';
  const CACHE_TAG='20260905-pro-v23';

  function addStyle(){
    if(document.getElementById('dfSystemStyle'))return;
    const st=document.createElement('style');
    st.id='dfSystemStyle';
    st.textContent=[
      '.dfSystemBar{position:fixed;right:14px;bottom:14px;z-index:99999;display:flex;gap:8px;align-items:center;background:rgba(8,11,19,.94);border:1px solid #334155;border-radius:16px;padding:8px 10px;box-shadow:0 12px 30px rgba(0,0,0,.35);backdrop-filter:blur(8px)}',
      '.dfSystemVer{font:800 12px system-ui;color:#facc15;white-space:nowrap}',
      '.dfSystemBtn{border:0;border-radius:12px;background:#f59e0b;color:#111827;font:900 11px system-ui;padding:9px 10px;cursor:pointer;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}',
      '.dfSystemBtn:active{transform:translateY(1px)}',
      '@media(max-width:560px){.dfSystemBar{left:10px;right:10px;bottom:10px;justify-content:space-between}.dfSystemBtn{font-size:10px;padding:9px 8px}}'
    ].join('');
    document.head.appendChild(st);
  }

  function clearBrowserCaches(){
    const jobs=[];
    try{
      if('caches' in window){
        jobs.push(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))));
      }
    }catch(e){}
    return Promise.allSettled(jobs);
  }

  function refreshClean(){
    const btn=document.getElementById('dfSystemRefresh');
    if(btn)btn.textContent='ATUALIZANDO...';
    clearBrowserCaches().finally(()=>{
      const url=new URL(location.href);
      url.searchParams.set('v',CACHE_TAG);
      url.searchParams.set('t',Date.now());
      location.replace(url.toString());
    });
  }

  function addBar(){
    addStyle();
    if(document.getElementById('dfSystemBar'))return;
    const bar=document.createElement('div');
    bar.id='dfSystemBar';
    bar.className='dfSystemBar';
    bar.innerHTML='<span class="dfSystemVer">DF EXTRUSOR PRO v'+APP_VERSION+'</span><button id="dfSystemRefresh" class="dfSystemBtn" type="button">ATUALIZAR SISTEMA</button>';
    document.body.appendChild(bar);
    const btn=document.getElementById('dfSystemRefresh');
    if(btn)btn.addEventListener('click',refreshClean);
  }

  function init(){
    addBar();
    setTimeout(addBar,500);
    setTimeout(addBar,1500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();