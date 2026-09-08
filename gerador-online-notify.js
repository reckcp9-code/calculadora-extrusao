(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const VAPID_PUBLIC_KEY='BCeh5o1hAKV598vbnKqDfoIMcsGZaxKmfW8fVmR3FdGoAOOUWeBoeikXc_s07eb47M-6Kwl991u4w0MFuv4-rGU';
  let reg=null;
  let refreshing=false;

  function $(id){return document.getElementById(id)}
  function secret(){const el=$('secret');return String(el&&el.value||'').trim()}
  function b64ToBytes(s){let b64=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(b64.length%4)b64+='=';const raw=atob(b64);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
  function isIos(){return /iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
  function standalone(){return window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches===true||navigator.standalone===true}

  async function post(path,body){
    const s=secret();if(!s)throw new Error('Digite a senha administrativa primeiro.');
    const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','X-DF-Admin':s},body:JSON.stringify(body||{}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false)throw new Error(j.error||('Erro HTTP '+r.status));
    return j;
  }

  async function registration(){
    if(!('serviceWorker' in navigator))throw new Error('Este navegador não oferece notificações push.');
    reg=reg||await navigator.serviceWorker.register('./sw.js',{scope:'./'});
    await navigator.serviceWorker.ready;
    try{await reg.update()}catch(e){}
    return reg;
  }

  async function subscription(create){
    const r=await registration();
    let sub=await r.pushManager.getSubscription();
    if(!sub&&create)sub=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToBytes(VAPID_PUBLIC_KEY)});
    return sub;
  }

  function setUi(enabled,msg,bad){
    const b=$('dfOnlineNotifyBtn'),m=$('dfOnlineNotifyMsg');
    if(b){b.textContent=enabled?'🔔 AVISOS DE ONLINE ATIVADOS':'🔕 ATIVAR AVISOS DE ONLINE';b.dataset.enabled=enabled?'1':'0'}
    if(m){m.textContent=msg||'';m.style.color=bad?'#fca5a5':enabled?'#86efac':'#94a3b8'}
  }

  async function refreshStatus(){
    if(refreshing||!secret())return;
    refreshing=true;
    try{
      if(!('Notification' in window)||!('PushManager' in window)){setUi(false,'Este navegador não oferece Web Push.',true);return}
      const granted=Notification.permission==='granted';
      let sub=await subscription(granted);
      if(!sub){setUi(false,'Notificações de entrada ainda não ativadas.');return}
      let j=await post('/admin/push/online-status',{endpoint:sub.endpoint});
      if(!j.enabled&&granted){
        await post('/admin/push/online-subscribe',{subscription:sub.toJSON()});
        j={enabled:true};
      }
      setUi(!!j.enabled,j.enabled?'Você receberá um aviso quando um usuário entrar e ficar online.':'Notificações de entrada ainda não ativadas.');
    }catch(e){setUi(false,String(e&&e.message||e),true)}finally{refreshing=false}
  }

  async function toggle(){
    const b=$('dfOnlineNotifyBtn');if(b)b.disabled=true;
    try{
      if(isIos()&&!standalone())throw new Error('No iPhone/iPad, abra este painel pelo app instalado na Tela de Início para ativar notificações.');
      if(!('Notification' in window)||!('PushManager' in window))throw new Error('Este navegador não oferece Web Push.');
      const current=await subscription(false),enabled=b&&b.dataset.enabled==='1';
      if(enabled){if(current)await post('/admin/push/online-unsubscribe',{endpoint:current.endpoint});setUi(false,'Avisos de entrada desativados.');return}
      const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Permita notificações nas configurações do aparelho.');
      const sub=current||await subscription(true);await post('/admin/push/online-subscribe',{subscription:sub.toJSON()});
      setUi(true,'Pronto. Você será avisado quando cada usuário entrar e ficar online.');
    }catch(e){setUi(false,String(e&&e.message||e),true)}finally{if(b)b.disabled=false}
  }

  function mount(){
    if($('dfOnlineNotifyCard'))return;
    const first=document.querySelector('.wrap .card');if(!first)return;
    const card=document.createElement('div');card.className='card';card.id='dfOnlineNotifyCard';
    card.innerHTML='<h2>🔔 Aviso quando usuário entrar</h2><div class="sub">Receba uma notificação no seu aparelho quando um usuário ficar ONLINE no DF EXTRUSOR PRO.</div><button class="btn alt" id="dfOnlineNotifyBtn" type="button" data-enabled="0">🔕 ATIVAR AVISOS DE ONLINE</button><div id="dfOnlineNotifyMsg" class="status">Digite sua senha administrativa e ative uma vez neste aparelho.</div>';
    first.insertAdjacentElement('afterend',card);
    $('dfOnlineNotifyBtn').onclick=toggle;
    const sec=$('secret');if(sec){sec.addEventListener('input',function(){setTimeout(refreshStatus,180)});sec.addEventListener('change',function(){setTimeout(refreshStatus,80)})}
    setTimeout(refreshStatus,250);
    setTimeout(refreshStatus,900);
  }

  window.addEventListener('focus',function(){setTimeout(refreshStatus,100)});
  window.addEventListener('pageshow',function(){setTimeout(refreshStatus,100)});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(refreshStatus,100)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();