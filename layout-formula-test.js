(function(){
  'use strict';

  function normalize(text){
    return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
  }

  function removeLiteralNewline(){
    const page=document.getElementById('pgFo');
    if(!page)return;
    Array.from(page.childNodes).forEach(function(node){
      if(node.nodeType===3&&String(node.nodeValue||'').includes('\\n')){
        node.nodeValue=String(node.nodeValue||'').replace(/\\n/g,'');
      }
    });
  }

  function addTestStyle(){
    if(document.getElementById('dfFormulaLayoutTestStyle'))return;
    const style=document.createElement('style');
    style.id='dfFormulaLayoutTestStyle';
    style.textContent=[
      '#pgFo.dfTestVendorOnly > #foDevArea{display:none!important}',
      '#pgFo.dfTestVendorOnly > .card:not(#dfVendedorCard){display:none!important}',
      '#pgFo.dfTestVendorOnly > #dfVendedorCard{display:block!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function syncVendorScreen(){
    const page=document.getElementById('pgFo');
    if(!page)return;
    const vendor=document.getElementById('dfVendedorCard');
    const vendorButton=Array.from(page.querySelectorAll(':scope > .dfAutoTopics .dfAutoTopic')).find(function(b){
      return normalize(b.textContent).includes('WHATSAPP / PDF');
    });
    const active=!!(vendor&&vendorButton&&vendorButton.classList.contains('on'));
    page.classList.toggle('dfTestVendorOnly',active);
  }

  function setup(){
    addTestStyle();
    removeLiteralNewline();
    const page=document.getElementById('pgFo');
    const nav=page&&page.querySelector(':scope > .dfAutoTopics');
    const ops=document.getElementById('dfFormTabOps');
    const form=document.getElementById('dfFormTabCore');
    if(!page||!nav||!ops||!form)return false;

    const buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
    const vendorButton=buttons.find(function(b){return normalize(b.textContent).includes('WHATSAPP / PDF')});
    if(vendorButton)vendorButton.dataset.dfVendorTopic='1';
    const backup=buttons.find(function(b){return normalize(b.textContent).includes('BACKUP NA NUVEM')});
    if(!backup)return false;

    backup.textContent='🤖 OPS AUTOMÁTICAS';
    backup.dataset.dfOpenOps='1';
    ops.style.display='none';

    if(!backup.dataset.dfBound){
      backup.dataset.dfBound='1';
      backup.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        nav.querySelectorAll('.dfAutoTopic').forEach(function(b){b.classList.toggle('on',b===backup)});
        page.querySelectorAll(':scope > .card').forEach(function(card){card.classList.remove('dfTopicVisible')});
        ops.click();
        page.classList.remove('dfTestVendorOnly');
        window.scrollTo(0,0);
      },true);
    }

    if(!form.dataset.dfTestBound){
      form.dataset.dfTestBound='1';
      form.addEventListener('click',function(){
        nav.querySelectorAll('.dfAutoTopic').forEach(function(b){b.classList.remove('on')});
      });
    }
    syncVendorScreen();
    return true;
  }

  function run(){
    if(setup())return;
    setTimeout(setup,120);
    setTimeout(setup,500);
    setTimeout(setup,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  window.addEventListener('df-ui-ready',run);
  document.addEventListener('click',function(){setTimeout(function(){setup();syncVendorScreen();},80)},true);
})();