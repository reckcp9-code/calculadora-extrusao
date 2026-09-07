(function(){
  'use strict';

  const API_PATH='/admin/access/list-used';
  const byKey=new Map();

  function platformLabel(v){
    const p=String(v||'').trim();
    if(p==='iPad')return '📱 iPad';
    if(p==='iOS')return '📱 iOS / iPhone';
    if(p==='Android')return '📱 Android';
    if(p==='PC')return '💻 PC';
    if(p==='Outro')return '🖥️ Outro dispositivo';
    return '⌛ Ainda não registrado';
  }

  function addStyle(){
    if(document.getElementById('dfPlatformStyle'))return;
    const st=document.createElement('style');
    st.id='dfPlatformStyle';
    st.textContent='.dfPlatformLine{display:inline-flex;align-items:center;margin-top:5px;padding:5px 8px;border:1px solid #334155;background:#0f172a;border-radius:9px;color:#cbd5e1;font-size:11px;font-weight:900}';
    document.head.appendChild(st);
  }

  function capture(j){
    const items=Array.isArray(j&&j.items)?j.items:[];
    items.forEach(function(it){
      const key=String(it&&it.licenseKey||'').trim();
      if(key)byKey.set(key,String(it&&it.platform||'').trim());
    });
    scheduleAnnotate();
  }

  function annotate(){
    addStyle();
    document.querySelectorAll('.usedItem').forEach(function(item){
      const keyEl=item.querySelector('.usedKey');
      const meta=item.querySelector('.usedMeta');
      if(!keyEl||!meta)return;
      const key=String(keyEl.textContent||'').trim();
      if(!key)return;
      let line=item.querySelector('.dfPlatformLine');
      if(!line){
        line=document.createElement('span');
        line.className='dfPlatformLine';
        meta.appendChild(document.createElement('br'));
        meta.appendChild(line);
      }
      line.textContent='Dispositivo: '+platformLabel(byKey.get(key)||'');
    });
  }

  let timer=0;
  function scheduleAnnotate(){
    clearTimeout(timer);
    timer=setTimeout(annotate,40);
    setTimeout(annotate,180);
    setTimeout(annotate,500);
  }

  const originalFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const response=await originalFetch(input,init);
    try{
      const u=new URL(typeof input==='string'?input:input.url,location.href);
      if(u.pathname===API_PATH&&response.ok){
        response.clone().json().then(capture).catch(function(){});
      }
    }catch(e){}
    return response;
  };

  document.addEventListener('click',function(){setTimeout(annotate,250)},true);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)scheduleAnnotate()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleAnnotate);
  else scheduleAnnotate();
})();
