(function(){
  'use strict';
  if(window.DFFormulaSeparateTabsTest)return;
  window.DFFormulaSeparateTabsTest=true;

  const $=id=>document.getElementById(id);
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase()}

  function addStyle(){
    if($('dfFormulaSeparateTabsTestStyle'))return;
    const s=document.createElement('style');
    s.id='dfFormulaSeparateTabsTestStyle';
    s.textContent=[
      /* WhatsApp: mantém a barra de tópicos para navegar e, abaixo dela, somente o card original completo do vendedor. */
      '#pgFo.dfTestWhatsOnly > *:not(.dfAutoTopics):not(#dfVendedorCard){display:none!important}',
      '#pgFo.dfTestWhatsOnly > #dfVendedorCard{display:block!important}',
      /* Backup: mantém a barra de tópicos para navegar e, abaixo dela, somente o card original de backup. */
      '#pgFo.dfTestBackupOnly > *:not(.dfAutoTopics):not(#dfCloudBackupCard){display:none!important}',
      '#pgFo.dfTestBackupOnly > #dfCloudBackupCard{display:block!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function setMode(mode){
    const page=$('pgFo');if(!page)return;
    page.classList.toggle('dfTestWhatsOnly',mode==='whatsapp');
    page.classList.toggle('dfTestBackupOnly',mode==='backup');
  }

  function setup(){
    addStyle();
    const page=$('pgFo');if(!page)return false;
    const nav=page.querySelector(':scope > .dfAutoTopics');if(!nav)return false;
    const buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
    const whatsapp=buttons.find(b=>norm(b.textContent).includes('WHATSAPP'));
    const backup=buttons.find(b=>norm(b.textContent).includes('BACKUP NA NUVEM')||b.dataset.dfBackupTop==='1');
    const ops=$('dfFormTabOps');
    const form=$('dfFormTabCore');

    if(whatsapp&&!whatsapp.dataset.dfSeparateTestBound){
      whatsapp.dataset.dfSeparateTestBound='1';
      whatsapp.addEventListener('click',()=>setTimeout(()=>setMode('whatsapp'),0));
    }
    if(backup&&!backup.dataset.dfSeparateTestBound){
      backup.dataset.dfSeparateTestBound='1';
      backup.addEventListener('click',()=>setTimeout(()=>setMode('backup'),0));
    }
    [ops,form].forEach(btn=>{
      if(btn&&!btn.dataset.dfSeparateTestClear){
        btn.dataset.dfSeparateTestClear='1';
        btn.addEventListener('click',()=>setMode(''));
      }
    });

    if(whatsapp&&whatsapp.classList.contains('on'))setMode('whatsapp');
    else if(backup&&backup.classList.contains('on'))setMode('backup');
    return true;
  }

  function run(){setup();setTimeout(setup,120);setTimeout(setup,500);setTimeout(setup,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('df-ui-ready',run);
})();
