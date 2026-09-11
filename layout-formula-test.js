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

  function setup(){
    removeLiteralNewline();
    const page=document.getElementById('pgFo');
    const nav=page&&page.querySelector(':scope > .dfAutoTopics');
    const ops=document.getElementById('dfFormTabOps');
    const form=document.getElementById('dfFormTabCore');
    if(!page||!nav||!ops||!form)return false;

    const buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
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
        window.scrollTo(0,0);
      },true);
    }

    if(!form.dataset.dfTestBound){
      form.dataset.dfTestBound='1';
      form.addEventListener('click',function(){
        nav.querySelectorAll('.dfAutoTopic').forEach(function(b){b.classList.remove('on')});
      });
    }
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
  document.addEventListener('click',function(){setTimeout(setup,80)},true);
})();