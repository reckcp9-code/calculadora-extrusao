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
      '#pgFo.dfTestWhatsOnly > *:not(.dfAutoTopics):not(#dfVendedorCard){display:none!important}',
      '#pgFo.dfTestWhatsOnly > #dfVendedorCard{display:block!important}',
      '#pgFo.dfTestBackupOnly > *:not(.dfAutoTopics):not(#dfCloudBackupCard){display:none!important}',
      '#pgFo.dfTestBackupOnly > #dfCloudBackupCard{display:block!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function setMode(mode,activeBtn){
    const page=$('pgFo');if(!page)return;
    const nav=page.querySelector(':scope > .dfAutoTopics');
    page.classList.toggle('dfTestWhatsOnly',mode==='whatsapp');
    page.classList.toggle('dfTestBackupOnly',mode==='backup');
    if(nav&&activeBtn){nav.querySelectorAll('.dfAutoTopic').forEach(b=>b.classList.toggle('on',b===activeBtn));}
    if(mode==='whatsapp'){
      page.classList.add('dfStableVendorOnly');
      page.classList.remove('dfStableBackupOnly');
    }else if(mode==='backup'){
      page.classList.add('dfStableBackupOnly');
      page.classList.remove('dfStableVendorOnly');
    }else{
      page.classList.remove('dfStableVendorOnly','dfStableBackupOnly');
    }
  }

  function bindDirect(btn,mode){
    if(!btn||btn.dataset.dfSeparateTestBound==='1')return;
    btn.dataset.dfSeparateTestBound='1';
    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setMode(mode,btn);
      window.scrollTo(0,0);
    },true);
  }

  function setup(){
    addStyle();
    const page=$('pgFo');if(!page)return false;
    const nav=page.querySelector(':scope > .dfAutoTopics');if(!nav)return false;
    const buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
    const whatsapp=buttons.find(b=>norm(b.textContent).includes('WHATSAPP'));
    const backup=buttons.find(b=>b.dataset.dfBackupTop==='1'||norm(b.textContent).includes('BACKUP NA NUVEM'));
    const ops=buttons.find(b=>b.dataset.dfOpenOps==='1'||norm(b.textContent).includes('OPS'));
    const formula=buttons.find(b=>norm(b.textContent).includes('FORMULA'));

    bindDirect(whatsapp,'whatsapp');
    bindDirect(backup,'backup');

    [ops,formula].forEach(btn=>{
      if(btn&&btn.dataset.dfSeparateTestClear!=='1'){
        btn.dataset.dfSeparateTestClear='1';
        btn.addEventListener('click',()=>setMode('',btn),true);
      }
    });

    if(whatsapp&&whatsapp.classList.contains('on'))setMode('whatsapp',whatsapp);
    else if(backup&&backup.classList.contains('on'))setMode('backup',backup);
    return true;
  }

  function run(){setup();setTimeout(setup,120);setTimeout(setup,500);setTimeout(setup,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('df-ui-ready',run);
})();
