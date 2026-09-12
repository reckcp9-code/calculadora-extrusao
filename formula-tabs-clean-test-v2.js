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
  function findFormula(){return buttons().find(b=>b.dataset.dfFormulaTop==='1'||norm(b.textContent)==='FORMULAÇÃO'||norm(b.textContent)==='FORMULACAO')||null}
  function clearMode(){const p=page();if(!p)return;p.classList.remove('dfCleanWhatsOnly','dfCleanBackupOnly')}
  function markActive(target){const n=nav();if(!n)return;n.querySelectorAll('.dfAutoTopic').forEach(b=>b.classList.toggle('on',b===target))}

  function ensureFormulaButton(){
    const n=nav();if(!n)return null;
    let formula=findFormula();if(formula)return formula;
    formula=document.createElement('button');
    formula.type='button';formula.className='dfAutoTopic';formula.dataset.dfFormulaTop='1';formula.textContent='🧪 FORMULAÇÃO';
    const backup=findBackup(),whats=findWhats();
    if(backup)n.insertBefore(formula,backup);else if(whats)n.insertBefore(formula,whats);else n.appendChild(formula);
    return formula;
  }

  function showWhats(btn){const p=page();if(!p)return;p.classList.remove('dfCleanBackupOnly');p.classList.add('dfCleanWhatsOnly');markActive(btn);window.scrollTo(0,0)}
  function showBackup(btn){const p=page();if(!p)return;p.classList.remove('dfCleanWhatsOnly');p.classList.add('dfCleanBackupOnly');markActive(btn);window.scrollTo(0,0)}
  function showFormula(btn){
    clearMode();markActive(btn);
    const form=$('dfFormTabCore');if(form)form.click();
    window.scrollTo(0,0);
  }

  function bind(){
    ensureStyle();
    const p=page(),n=nav();if(!p||!n)return false;
    const formula=ensureFormulaButton(),whats=findWhats(),backup=findBackup();

    if(formula&&!formula.dataset.dfCleanTabsBound){formula.dataset.dfCleanTabsBound='1';formula.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();showFormula(formula)},true)}
    if(whats&&!whats.dataset.dfCleanTabsBound){whats.dataset.dfCleanTabsBound='1';whats.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();showWhats(whats)},true)}
    if(backup&&!backup.dataset.dfCleanTabsBound){backup.dataset.dfCleanTabsBound='1';backup.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();showBackup(backup)},true)}

    const form=$('dfFormTabCore'),ops=$('dfFormTabOps');
    [form,ops].forEach(btn=>{if(btn&&!btn.dataset.dfCleanTabsClear){btn.dataset.dfCleanTabsClear='1';btn.addEventListener('click',clearMode,true)}});
    buttons().forEach(btn=>{if(btn===formula||btn===whats||btn===backup)return;if(!btn.dataset.dfCleanTabsClear){btn.dataset.dfCleanTabsClear='1';btn.addEventListener('click',clearMode,true)}});
    return true;
  }

  function start(){if(bind())return;let tries=0;const t=setInterval(()=>{tries++;if(bind()||tries>=12)clearInterval(t)},250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',bind,{once:true});
})();
