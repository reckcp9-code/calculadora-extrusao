(function(){
  'use strict';
  if(window.DFUpdateNotifyV1)return;
  window.DFUpdateNotifyV1=true;

  const SEEN_KEY='df_update_seen_version_v1';
  const CHECK_MS=5*60*1000;
  let timer=0,open=false;

  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

  function addStyle(){
    if(document.getElementById('dfUpdateNotifyStyle'))return;
    const s=document.createElement('style');
    s.id='dfUpdateNotifyStyle';
    s.textContent='#dfUpdateNotify{position:fixed;z-index:2147483000;inset:0;background:#020617cc;display:flex;align-items:center;justify-content:center;padding:18px}#dfUpdateNotify .box{width:min(420px,100%);background:#111827;border:1px solid #f5a000;border-radius:18px;padding:18px;box-shadow:0 24px 80px #0008;color:#f8fafc}#dfUpdateNotify h3{margin:0 0 8px;color:#ffd36a;font-size:21px}#dfUpdateNotify p{margin:0;color:#cbd5e1;font-size:14px;line-height:1.5}#dfUpdateNotify .ver{margin-top:10px;color:#93c5fd;font-weight:900;font-size:12px}#dfUpdateNotify button{width:100%;margin-top:14px;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:12px;padding:13px;font-weight:950;font-size:15px}';
    document.head.appendChild(s);
  }

  function systemNotify(title,body){
    try{
      if('Notification' in window&&Notification.permission==='granted'){
        new Notification(title,{body,icon:'./logo.jpg.jpeg',tag:'df-update'});
      }
    }catch(e){}
  }

  function show(v){
    if(open||!v||!v.version)return;
    open=true;addStyle();
    const old=document.getElementById('dfUpdateNotify');if(old)old.remove();
    const wrap=document.createElement('div');wrap.id='dfUpdateNotify';
    wrap.innerHTML='<div class="box"><h3>🚀 NOVA ATUALIZAÇÃO</h3><p>'+esc(v.message||v.title||'O DF EXTRUSOR PRO foi atualizado.')+'</p><div class="ver">Versão '+esc(v.version)+'</div><button type="button">OK, ENTENDI</button></div>';
    wrap.querySelector('button').onclick=()=>{try{localStorage.setItem(SEEN_KEY,String(v.version))}catch(e){}wrap.remove();open=false};
    document.body.appendChild(wrap);
    systemNotify('DF EXTRUSOR PRO atualizado',String(v.message||('Nova versão '+v.version)));
  }

  async function check(){
    try{
      const r=await fetch('./app-version.json?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return;
      const v=await r.json();
      const current=String(v&&v.version||'').trim();if(!current)return;
      let seen='';try{seen=String(localStorage.getItem(SEEN_KEY)||'')}catch(e){}
      if(seen!==current)show(v);
    }catch(e){}
  }

  function start(){check();clearInterval(timer);timer=setInterval(()=>{if(!document.hidden)check()},CHECK_MS)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('pageshow',()=>setTimeout(check,300));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(check,200)});
})();
