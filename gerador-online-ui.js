(function(){
  'use strict';

  const API_PATH='/admin/access/list-used';
  const ONLINE_MS=330000;
  const AUTO_REFRESH_MS=15000;
  const byKey=new Map();
  const originalFetch=window.fetch.bind(window);
  let refreshTimer=0;
  let annotateTimer=0;

  function addStyle(){
    if(document.getElementById('dfOnlineStyle'))return;
    const st=document.createElement('style');
    st.id='dfOnlineStyle';
    st.textContent=[
      '.dfOnlineBadge{display:inline-flex;align-items:center;margin-left:6px;margin-bottom:6px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:1000;letter-spacing:.02em}',
      '.dfOnlineBadge.on{color:#bbf7d0;border:1px solid #22c55e;background:#052e16}',
      '.dfOnlineBadge.off{color:#cbd5e1;border:1px solid #475569;background:#111827}',
      '#dfOnlineSummary{margin-top:8px;font-size:11px;font-weight:900;color:#86efac}',
      '#dfOnlineAuto{margin-top:4px;font-size:10px;color:#93c5fd;font-weight:800}'
    ].join('');
    document.head.appendChild(st);
  }

  function secret(){
    const el=document.getElementById('secret');
    return String(el&&el.value||'').trim();
  }

  function isOnline(value){
    const t=Date.parse(String(value||''));
    return Number.isFinite(t)&&Date.now()-t>=0&&Date.now()-t<ONLINE_MS;
  }

  function capture(items){
    const rows=Array.isArray(items)?items:[];
    const alive=new Set();
    rows.forEach(function(it){
      const key=String(it&&it.licenseKey||'').trim();
      if(!key)return;
      alive.add(key);
      byKey.set(key,String(it&&it.presenceAt||'').trim());
    });
    Array.from(byKey.keys()).forEach(function(key){if(!alive.has(key))byKey.delete(key)});
    scheduleAnnotate();
  }

  function annotate(){
    addStyle();
    let online=0,total=0;
    document.querySelectorAll('.usedItem').forEach(function(item){
      const keyEl=item.querySelector('.usedKey');
      if(!keyEl)return;
      const key=String(keyEl.textContent||'').trim();
      if(!key)return;
      total++;
      const on=isOnline(byKey.get(key));
      if(on)online++;
      let badge=item.querySelector('.dfOnlineBadge');
      if(!badge){
        badge=document.createElement('span');
        badge.className='dfOnlineBadge';
        const pill=item.querySelector('.pill');
        if(pill&&pill.parentNode)pill.insertAdjacentElement('afterend',badge);
        else item.insertBefore(badge,item.firstChild);
      }
      badge.className='dfOnlineBadge '+(on?'on':'off');
      badge.textContent=on?'● ONLINE':'○ OFFLINE';
    });

    let sum=document.getElementById('dfOnlineSummary');
    const msg=document.getElementById('usedMsg');
    if(msg&&!sum){
      sum=document.createElement('div');
      sum.id='dfOnlineSummary';
      msg.insertAdjacentElement('afterend',sum);
    }
    if(sum){
      sum.textContent=online+' online agora'+(total?' • '+total+' exibido'+(total===1?'':'s'):'');
      let auto=document.getElementById('dfOnlineAuto');
      if(!auto){
        auto=document.createElement('div');
        auto.id='dfOnlineAuto';
        sum.insertAdjacentElement('afterend',auto);
      }
      auto.textContent='⚡ Atualização automática econômica • a cada '+Math.round(AUTO_REFRESH_MS/1000)+' s';
    }
  }

  function scheduleAnnotate(){
    clearTimeout(annotateTimer);
    annotateTimer=setTimeout(annotate,40);
    setTimeout(annotate,180);
    setTimeout(annotate,450);
  }

  window.fetch=async function(input,init){
    const response=await originalFetch(input,init);
    try{
      const u=new URL(typeof input==='string'?input:input.url,location.href);
      if(u.pathname===API_PATH&&response.ok){
        response.clone().json().then(function(j){if(j&&j.ok!==false)capture(j.items)}).catch(function(){});
      }
    }catch(e){}
    return response;
  };

  function scheduleRefresh(ms){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(refresh,Math.max(500,Number(ms)||AUTO_REFRESH_MS));
  }

  function refresh(){
    if(document.hidden){scheduleRefresh(AUTO_REFRESH_MS);return}
    const btn=document.getElementById('usedBtn');
    if(secret()&&btn&&!btn.disabled){
      try{btn.click()}catch(e){}
    }
    scheduleRefresh(AUTO_REFRESH_MS);
  }

  function init(){
    addStyle();
    scheduleRefresh(700);
    scheduleAnnotate();
    const input=document.getElementById('secret');
    if(input)input.addEventListener('input',function(){scheduleRefresh(250)});
  }

  document.addEventListener('visibilitychange',function(){if(!document.hidden){scheduleRefresh(150);scheduleAnnotate()}});
  window.addEventListener('focus',function(){scheduleRefresh(150)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
