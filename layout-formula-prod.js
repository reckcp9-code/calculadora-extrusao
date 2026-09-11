(function(){
  'use strict';

  function norm(text){
    return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
  }

  function addStyle(){
    if(document.getElementById('dfFormulaLayoutTestStyle'))return;
    const s=document.createElement('style');
    s.id='dfFormulaLayoutTestStyle';
    s.textContent=[
      '#pgFo.dfTestVendorOnly > #foDevArea{display:none!important}',
      '#pgFo.dfTestVendorOnly > .card:not(#dfVendedorCard){display:none!important}',
      '#pgFo.dfTestVendorOnly > #dfVendedorCard{display:block!important}',
      '#pgFo.dfTestBackupOnly > #foDevArea{display:none!important}',
      '#pgFo.dfTestBackupOnly > .card:not(#dfCloudBackupCard){display:none!important}',
      '#pgFo.dfTestBackupOnly > #dfCloudBackupCard{display:block!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function removeLiteralNewline(){
    const page=document.getElementById('pgFo');
    if(!page)return;
    Array.from(page.childNodes).forEach(function(node){
      if(node.nodeType===3)node.nodeValue=String(node.nodeValue||'').replace(/\\n/g,'');
    });
  }

  function syncScreens(){
    const page=document.getElementById('pgFo');
    if(!page)return;
    const nav=page.querySelector(':scope > .dfAutoTopics');
    if(!nav)return;
    const vendor=nav.querySelector('[data-df-vendor-topic="1"]');
    const backup=nav.querySelector('[data-df-backup-top="1"]');
    page.classList.toggle('dfTestVendorOnly',!!(vendor&&vendor.classList.contains('on')));
    page.classList.toggle('dfTestBackupOnly',!!(backup&&backup.classList.contains('on')));
  }

  function setup(){
    addStyle();
    removeLiteralNewline();
    const page=document.getElementById('pgFo');
    const nav=page&&page.querySelector(':scope > .dfAutoTopics');
    const ops=document.getElementById('dfFormTabOps');
    const form=document.getElementById('dfFormTabCore');
    const backupCard=document.getElementById('dfCloudBackupCard');
    if(!page||!nav||!ops||!form||!backupCard)return false;

    let buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
    const vendor=buttons.find(function(b){return norm(b.textContent).includes('WHATSAPP / PDF')});
    if(vendor)vendor.dataset.dfVendorTopic='1';

    let opsTop=nav.querySelector('[data-df-open-ops="1"]');
    if(!opsTop){
      opsTop=buttons.find(function(b){
        return norm(b.textContent).includes('BACKUP NA NUVEM')&&!b.dataset.dfBackupTop;
      });
      if(!opsTop)return false;
      opsTop.textContent='🤖 OPS AUTOMÁTICAS';
      opsTop.dataset.dfOpenOps='1';
    }

    let backupTop=nav.querySelector('[data-df-backup-top="1"]');
    if(!backupTop){
      backupTop=document.createElement('button');
      backupTop.type='button';
      backupTop.className='dfAutoTopic';
      backupTop.dataset.dfBackupTop='1';
      backupTop.textContent='☁ BACKUP NA NUVEM';
      if(vendor&&vendor.nextSibling)nav.insertBefore(backupTop,vendor.nextSibling);
      else nav.appendChild(backupTop);
    }

    ops.style.display='none';

    if(!opsTop.dataset.dfBound){
      opsTop.dataset.dfBound='1';
      opsTop.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        nav.querySelectorAll('.dfAutoTopic').forEach(function(b){b.classList.toggle('on',b===opsTop)});
        page.querySelectorAll(':scope > .card').forEach(function(card){card.classList.remove('dfTopicVisible')});
        page.classList.remove('dfTestVendorOnly','dfTestBackupOnly');
        ops.click();
        window.scrollTo(0,0);
      },true);
    }

    if(!backupTop.dataset.dfBound){
      backupTop.dataset.dfBound='1';
      backupTop.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        nav.querySelectorAll('.dfAutoTopic').forEach(function(b){b.classList.toggle('on',b===backupTop)});
        page.querySelectorAll(':scope > .card').forEach(function(card){card.classList.toggle('dfTopicVisible',card===backupCard)});
        page.classList.remove('dfTestVendorOnly');
        page.classList.add('dfTestBackupOnly');
        window.scrollTo(0,0);
      },true);
    }

    if(!form.dataset.dfTestBound){
      form.dataset.dfTestBound='1';
      form.addEventListener('click',function(){
        nav.querySelectorAll('.dfAutoTopic').forEach(function(b){b.classList.remove('on')});
        page.classList.remove('dfTestVendorOnly','dfTestBackupOnly');
      });
    }

    syncScreens();
    return true;
  }

  function run(){
    setup();
    setTimeout(setup,120);
    setTimeout(setup,500);
    setTimeout(setup,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  window.addEventListener('df-ui-ready',run);
  document.addEventListener('click',function(){setTimeout(function(){setup();syncScreens();},80)},true);
})();
