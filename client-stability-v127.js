(function(){
  'use strict';
  if(window.DFClientStability127)return;
  window.DFClientStability127=true;

  const localYmd=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())};
  let qrLoading=false;

  function ensureLocalMonth(){
    const m=document.getElementById('dfOpMonth');
    if(m&&!m.dataset.dfLocalDateFixed){m.dataset.dfLocalDateFixed='1';m.value=localYmd().slice(0,7);try{m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}}
  }

  function ensureQrLibrary(){
    if(typeof window.QRCode==='function'||qrLoading)return;
    qrLoading=true;
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.async=true;
    s.onload=()=>{qrLoading=false;try{window.dispatchEvent(new CustomEvent('df-qr-ready'))}catch(e){}};
    s.onerror=()=>{qrLoading=false};
    document.head.appendChild(s);
  }

  function verify(){
    ensureLocalMonth();
    ensureQrLibrary();
    const backup=document.getElementById('dfCloudBackupCard');
    const pg=document.getElementById('pgFo');
    if(backup&&pg&&backup.parentElement!==pg)pg.appendChild(backup);
  }

  function run(){verify();setTimeout(verify,400);setTimeout(verify,1400);setTimeout(verify,3500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('df-ui-ready',run);
  window.addEventListener('online',ensureQrLibrary);
})();