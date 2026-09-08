(function(){
  'use strict';

  const API_PATH='/admin/access/list-used';
  const ONLINE_MS=330000;
  const AUTO_REFRESH_MS=15000;
  const byKey=new Map();
  const originalFetch=window.fetch.bind(window);
  let refreshTimer=0;
  let annotateTimer=0;
  let monitorEnabled=false;

  function addStyle(){
    if(document.getElementById('dfOnlineStyle'))return;
    const st=document.createElement('style');
    st.id='dfOnlineStyle';
    st.textContent=[
      '.dfOnlineBadge{display:inline-flex;align-items:center;margin-left:6px;margin-bottom:6px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:1000;letter-spacing:.02em}',
      '.dfOnlineBadge.on{color:#bbf7d0;border:1px solid #22c55e;background:#052e16}',
      '.dfOnlineBadge.off{color:#cbd5e1;border:1px solid #475569;background:#111827}',
      '#dfOnlineSummary{margin-top:8px;font-size:11px;font-weight:900;color:#86efac}',
      '#dfOnlineAuto{margin-top:4px;font-size:10px;color:#93c5fd;font-weight:800}',
      '#dfOnlineControl{margin-top:10px;display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #334155;border-radius:12px;background:#0b1220;color:#dbeafe;font:900 11px system-ui}',
      '#dfOnlineControl input{width:18px;height:18px;accent-color:#22c55e;cursor:pointer}',
      '#dfOnlineControl .on{color:#86efac}',
      '#dfOnlineControl .off{color:#94a3b8}'
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

  function ensureControl(){
    const msg=document.getElementById('usedMsg');
    if(!msg||document.getElementById('dfOnlineControl'))return;
    const box=document.createElement('label');
    box.id='dfOnlineControl';
    box.innerHTML='<input id="dfOnlineToggle" type="checkbox"><span id="dfOnlineToggleText" class="off">MONITORAR QUEM ESTÁ ONLINE</span>';
    msg.insertAdjacentElement('afterend',box);
    const toggle=document.getElementById('dfOnlineToggle');
    toggle.checked=false;
    toggle.addEventListener('change',function(){
      monitorEnabled=!!toggle.checked;
      updateControlText();
      if(monitorEnabled){
        if(!document.hidden)refreshNow();
      }else{
        stopRefresh();
      }
      annotate();
    });
  }

  function updateControlText(){
    const text=document.getElementById('dfOnlineToggleText');
    if(!text)return;
    if(monitorEnabled){
      text.className='on';
      text.textContent=document.hidden?'MONITOR ATIVO • PAUSADO FORA DO PAINEL':'MONITOR ATIVO • BUSCANDO A CADA 15 s';
    }else{
      text.className='off';
      text.textContent='MONITORAR QUEM ESTÁ ONLINE';
    }
  }

  function annotate(){
    addStyle();
    ensureControl();
    updateControlText();
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
      const control=document.getElementById('dfOnlineControl');
      if(control)control.insertAdjacentElement('afterend',sum);else msg.insertAdjacentElement('afterend',sum);
    }
    if(sum){
      sum.textContent=online+' online agora'+(total?' • '+total+' exibido'+(total===1?'':'s'):'');
      let auto=document.getElementById('dfOnlineAuto');
      if(!auto){
        auto=document.createElement('div');
        auto.id='dfOnlineAuto';
        sum.insertAdjacentElement('afterend',auto);
      }
      if(!monitorEnabled)auto.textContent='⏸ Monitor automático desligado • não consome consultas em segundo plano';
      else if(document.hidden)auto.textContent='⏸ Monitor pausado • painel fora de foco';
      else auto.textContent='⚡ Monitor ativo • somente com o painel aberto • a cada '+Math.round(AUTO_REFRESH_MS/1000)+' s';
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

  function stopRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer=0;
  }

  function scheduleRefresh(ms){
    stopRefresh();
    if(!monitorEnabled||document.hidden)return;
    refreshTimer=setTimeout(refresh,Math.max(500,Number(ms)||AUTO_REFRESH_MS));
  }

  function refreshNow(){
    if(!monitorEnabled||document.hidden)return;
    const btn=document.getElementById('usedBtn');
    if(secret()&&btn&&!btn.disabled){
      try{btn.click()}catch(e){}
    }
    scheduleRefresh(AUTO_REFRESH_MS);
  }

  function refresh(){refreshNow();}

  function init(){
    addStyle();
    scheduleAnnotate();
    const input=document.getElementById('secret');
    if(input)input.addEventListener('input',function(){if(monitorEnabled&&!document.hidden)scheduleRefresh(250)});
  }

  document.addEventListener('visibilitychange',function(){
    if(document.hidden){
      stopRefresh();
      updateControlText();
      annotate();
      return;
    }
    updateControlText();
    if(monitorEnabled)scheduleRefresh(150);
    scheduleAnnotate();
  });
  window.addEventListener('focus',function(){if(monitorEnabled&&!document.hidden)scheduleRefresh(150)});
  window.addEventListener('pagehide',stopRefresh);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
