(function(){
  'use strict';
  if(window.DFFormulaLayoutStable)return;
  window.DFFormulaLayoutStable=true;

  let scheduled=false,observer=null;
  const byId=id=>document.getElementById(id);
  function norm(text){return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase()}

  function addStyle(){
    if(byId('dfFormulaLayoutStableStyle'))return;
    const s=document.createElement('style');
    s.id='dfFormulaLayoutStableStyle';
    s.textContent=[
      '#pgFo:not(.dfStableBackupOnly) > #dfCloudBackupCard{display:none!important}',
      '#pgFo.dfStableVendorOnly > #foDevArea{display:none!important}',
      '#pgFo.dfStableVendorOnly > .card:not(#dfVendedorCard){display:none!important}',
      '#pgFo.dfStableVendorOnly > #dfVendedorCard{display:block!important}',
      '#pgFo.dfStableBackupOnly > #foDevArea{display:none!important}',
      '#pgFo.dfStableBackupOnly > .card:not(#dfCloudBackupCard){display:none!important}',
      '#pgFo.dfStableBackupOnly > #dfCloudBackupCard{display:block!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function cleanLegacy(){
    const nome=byId('foNome');
    if(nome){
      const label=nome.parentElement&&nome.parentElement.querySelector('label');
      if(label)label.textContent='Cliente:';
      nome.placeholder='Ex.: Nome do cliente';
    }
    ['dfOpenLit','dfLitModal'].forEach(id=>{const e=byId(id);if(e)e.remove()});
    ['dfFoLitragem','dfFoMicra'].forEach(id=>{const e=byId(id);if(e&&e.parentElement)e.parentElement.remove()});
    const page=byId('pgFo');
    if(page)Array.from(page.childNodes).forEach(node=>{if(node.nodeType===3)node.nodeValue=String(node.nodeValue||'').replace(/\\n/g,'')});
  }

  function syncScreens(){
    const page=byId('pgFo');if(!page)return;
    const nav=page.querySelector(':scope > .dfAutoTopics');if(!nav)return;
    const vendor=nav.querySelector('[data-df-vendor-topic="1"]');
    const backup=nav.querySelector('[data-df-backup-top="1"]');
    page.classList.toggle('dfStableVendorOnly',!!(vendor&&vendor.classList.contains('on')));
    page.classList.toggle('dfStableBackupOnly',!!(backup&&backup.classList.contains('on')));
  }

  function setup(){
    scheduled=false;addStyle();cleanLegacy();
    const page=byId('pgFo');
    const nav=page&&page.querySelector(':scope > .dfAutoTopics');
    const ops=byId('dfFormTabOps'),form=byId('dfFormTabCore'),backupCard=byId('dfCloudBackupCard');
    if(!page||!nav||!ops||!form||!backupCard)return false;

    const buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
    const vendor=buttons.find(b=>norm(b.textContent).includes('WHATSAPP / PDF'));
    if(vendor)vendor.dataset.dfVendorTopic='1';

    let opsTop=nav.querySelector('[data-df-open-ops="1"]');
    if(!opsTop){
      opsTop=buttons.find(b=>norm(b.textContent).includes('BACKUP NA NUVEM')&&!b.dataset.dfBackupTop);
      if(!opsTop)return false;
      opsTop.textContent='🤖 OPS AUTOMÁTICAS';opsTop.dataset.dfOpenOps='1';
    }

    let backupTop=nav.querySelector('[data-df-backup-top="1"]');
    if(!backupTop){
      backupTop=document.createElement('button');backupTop.type='button';backupTop.className='dfAutoTopic';backupTop.dataset.dfBackupTop='1';backupTop.textContent='☁ BACKUP NA NUVEM';
      if(vendor&&vendor.nextSibling)nav.insertBefore(backupTop,vendor.nextSibling);else nav.appendChild(backupTop);
    }

    ops.style.display='none';
    if(!opsTop.dataset.dfStableBound){
      opsTop.dataset.dfStableBound='1';
      opsTop.addEventListener('click',function(e){
        e.preventDefault();e.stopImmediatePropagation();
        nav.querySelectorAll('.dfAutoTopic').forEach(b=>b.classList.toggle('on',b===opsTop));
        page.querySelectorAll(':scope > .card').forEach(card=>card.classList.remove('dfTopicVisible'));
        page.classList.remove('dfStableVendorOnly','dfStableBackupOnly');
        ops.click();window.scrollTo(0,0);
      },true);
    }
    if(!backupTop.dataset.dfStableBound){
      backupTop.dataset.dfStableBound='1';
      backupTop.addEventListener('click',function(e){
        e.preventDefault();e.stopImmediatePropagation();
        nav.querySelectorAll('.dfAutoTopic').forEach(b=>b.classList.toggle('on',b===backupTop));
        page.querySelectorAll(':scope > .card').forEach(card=>card.classList.toggle('dfTopicVisible',card===backupCard));
        page.classList.remove('dfStableVendorOnly');page.classList.add('dfStableBackupOnly');window.scrollTo(0,0);
      },true);
    }
    if(!form.dataset.dfStableBound){
      form.dataset.dfStableBound='1';
      form.addEventListener('click',function(){nav.querySelectorAll('.dfAutoTopic').forEach(b=>b.classList.remove('on'));page.classList.remove('dfStableVendorOnly','dfStableBackupOnly')});
    }
    syncScreens();
    if(!observer){
      observer=new MutationObserver(schedule);
      observer.observe(page,{childList:true,subtree:false});
    }
    return true;
  }

  function schedule(){if(scheduled)return;scheduled=true;setTimeout(setup,60)}
  function run(){setup();setTimeout(setup,180);setTimeout(setup,700);setTimeout(setup,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('df-ui-ready',run);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
})();