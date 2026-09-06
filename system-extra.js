(function(){
  const APP_VERSION='1.0.24';
  const CACHE_TAG='20260905-pro-v24';

  function addStyle(){
    if(document.getElementById('dfSystemStyle'))return;
    const st=document.createElement('style');
    st.id='dfSystemStyle';
    st.textContent=[
      '.dfSystemBar{position:relative;z-index:20;display:flex;gap:8px;align-items:center;justify-content:space-between;background:rgba(8,11,19,.94);border:1px solid #334155;border-radius:16px;padding:8px 10px;margin:-4px 0 12px;box-shadow:0 10px 26px rgba(0,0,0,.25);backdrop-filter:blur(8px)}',
      '.dfSystemVer{font:800 12px system-ui;color:#facc15;white-space:nowrap}',
      '.dfSystemBtn{border:0;border-radius:12px;background:#f59e0b;color:#111827;font:900 11px system-ui;padding:9px 10px;cursor:pointer;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}',
      '.dfSystemBtn:active{transform:translateY(1px)}',
      '@media(max-width:560px){.dfSystemBar{margin:0 0 10px;padding:8px}.dfSystemVer{font-size:11px}.dfSystemBtn{font-size:10px;padding:8px 8px}}'
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
    let bar=document.getElementById('dfSystemBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='dfSystemBar';
    }
    bar.className='dfSystemBar';
    bar.innerHTML='<span class="dfSystemVer">DF EXTRUSOR PRO v'+APP_VERSION+'</span><button id="dfSystemRefresh" class="dfSystemBtn" type="button">↻ ATUALIZAR</button>';

    const app=document.getElementById('appContent');
    const tabs=app?app.querySelector('.tabs'):document.querySelector('.tabs');
    if(tabs&&tabs.parentNode){
      tabs.parentNode.insertBefore(bar,tabs);
    }else if(app){
      app.insertBefore(bar,app.firstChild);
    }else{
      document.body.insertBefore(bar,document.body.firstChild);
    }

    const btn=document.getElementById('dfSystemRefresh');
    if(btn&&!btn.dfRefreshBound){
      btn.dfRefreshBound=true;
      btn.addEventListener('click',refreshClean);
    }
  }

  function init(){
    addBar();
    setTimeout(addBar,500);
    setTimeout(addBar,1500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();