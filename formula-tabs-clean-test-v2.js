(function(){
  'use strict';
  if(window.DFFormulaTabsCleanTestV2)return;
  window.DFFormulaTabsCleanTestV2=true;

  const $=id=>document.getElementById(id);
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();

  function ensureStyle(){
    if($('dfFormulaTabsCleanTestV2Style'))return;
    const s=document.createElement('style');
    s.id='dfFormulaTabsCleanTestV2Style';
    s.textContent=[
      '#pgFo.dfCleanWhatsOnly > *:not(.dfAutoTopics):not(#dfVendedorCard){display:none!important}',
      '#pgFo.dfCleanWhatsOnly > #dfVendedorCard{display:block!important}',
      '#pgFo.dfCleanBackupOnly > *:not(.dfAutoTopics):not(#dfCloudBackupCard){display:none!important}',
      '#pgFo.dfCleanBackupOnly > #dfCloudBackupCard{display:block!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function page(){return $('pgFo')}
  function nav(){const p=page();return p&&p.querySelector(':scope > .dfAutoTopics')}
  function buttons(){const n=nav();return n?Array.from(n.querySelectorAll('.dfAutoTopic')):[]}
  function findWhats(){return buttons().find(b=>norm(b.textContent).includes('WHATSAPP'))||null}
  function findBackup(){return buttons().find(b=>norm(b.textContent).includes('BACKUP NA NUVEM')||b.dataset.dfBackupTop==='1')||null}
  function clearMode(){const p=page();if(!p)return;p.classList.remove('dfCleanWhatsOnly','dfCleanBackupOnly')}
  function markActive(target){const n=nav();if(!n)return;n.querySelectorAll('.dfAutoTopic').forEach(b=>b.classList.toggle('on',b===target))}

  function showWhats(btn){
    const p=page();if(!p)return;
    p.classList.remove('dfCleanBackupOnly');
    p.classList.add('dfCleanWhatsOnly');
    markActive(btn);
    window.scrollTo(0,0);
  }

  function showBackup(btn){
    const p=page();if(!p)return;
    p.classList.remove('dfCleanWhatsOnly');
    p.classList.add('dfCleanBackupOnly');
    markActive(btn);
    window.scrollTo(0,0);
  }

  function bind(){
    ensureStyle();
    const p=page(),n=nav();if(!p||!n)return false;
    const whats=findWhats(),backup=findBackup();

    if(whats&&!whats.dataset.dfCleanTabsBound){
      whats.dataset.dfCleanTabsBound='1';
      whats.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        showWhats(whats);
      },true);
    }

    if(backup&&!backup.dataset.dfCleanTabsBound){
      backup.dataset.dfCleanTabsBound='1';
      backup.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        showBackup(backup);
      },true);
    }

    const form=$('dfFormTabCore'),ops=$('dfFormTabOps');
    [form,ops].forEach(btn=>{
      if(btn&&!btn.dataset.dfCleanTabsClear){
        btn.dataset.dfCleanTabsClear='1';
        btn.addEventListener('click',clearMode,true);
      }
    });

    buttons().forEach(btn=>{
      if(btn===whats||btn===backup)return;
      if(!btn.dataset.dfCleanTabsClear){
        btn.dataset.dfCleanTabsClear='1';
        btn.addEventListener('click',clearMode,true);
      }
    });

    return true;
  }

  function start(){
    if(bind())return;
    let tries=0;
    const t=setInterval(()=>{
      tries++;
      if(bind()||tries>=12)clearInterval(t);
    },250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',bind,{once:true});
})();
