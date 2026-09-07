(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const ONLINE_MS=130000;
  const POLL_MS=20000;
  const byKey=new Map();
  const silentFetch=window.fetch.bind(window);
  let pollTimer=0;
  let clockTimer=0;
  let polling=false;
  let primed=false;

  function addStyle(){
    if(document.getElementById('dfOnlineStyle'))return;
    const st=document.createElement('style');
    st.id='dfOnlineStyle';
    st.textContent=[
      '.dfOnlineBadge{display:inline-flex;align-items:center;margin-left:6px;margin-bottom:6px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:1000;letter-spacing:.02em}',
      '.dfOnlineBadge.on{color:#bbf7d0;border:1px solid #22c55e;background:#052e16}',
      '.dfOnlineBadge.off{color:#cbd5e1;border:1px solid #475569;background:#111827}',
      '#dfOnlineSummary{margin-top:8px;font-size:11px;font-weight:900;color:#86efac}'
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
    rows.forEach(function(it){
      const key=String(it&&it.licenseKey||'').trim();
      if(key)byKey.set(key,String(it&&it.presenceAt||'').trim());
    });
    annotate();
    const list=document.getElementById('usedList');
    const btn=document.getElementById('usedBtn');
    if(!primed&&rows.length&&list&&list.querySelector('.empty')&&btn&&!btn.disabled){
      primed=true;
      setTimeout(function(){try{btn.click()}catch(e){}},80);
    }
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
    if(sum)sum.textContent=online+' online agora'+(total?' • '+total+' exibido'+(total===1?'':'s'):'');
  }

  function scheduleClock(){
    clearTimeout(clockTimer);
    clockTimer=setTimeout(function(){
      if(!document.hidden)annotate();
      scheduleClock();
    },10000);
  }

  function schedulePoll(ms){
    clearTimeout(pollTimer);
    pollTimer=setTimeout(poll,Math.max(1000,Number(ms)||POLL_MS));
  }

  async function poll(){
    if(document.hidden||polling){schedulePoll(POLL_MS);return}
    const s=secret();
    if(!s){schedulePoll(5000);return}
    polling=true;
    try{
      const r=await silentFetch(API+'/admin/access/list-used',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Admin':s},
        body:'{}',
        cache:'no-store'
      });
      if(r.ok){
        let j={};try{j=await r.json()}catch(e){}
        if(j&&j.ok!==false)capture(j.items);
      }
    }catch(e){}finally{
      polling=false;
      schedulePoll(POLL_MS);
    }
  }

  function init(){
    addStyle();
    schedulePoll(900);
    scheduleClock();
    const input=document.getElementById('secret');
    if(input)input.addEventListener('input',function(){schedulePoll(300)});
  }

  document.addEventListener('visibilitychange',function(){if(!document.hidden){schedulePoll(250);annotate()}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
