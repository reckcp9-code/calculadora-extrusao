(function(){
  'use strict';
  if(window.DFFormulaTabsCleanV1)return;
  window.DFFormulaTabsCleanV1=true;

  const $=id=>document.getElementById(id);
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
  let navObserver=null,fixTimer=0;

  function ensureStyle(){
    if($('dfFormulaTabsCleanV1Style'))return;
    const s=document.createElement('style');
    s.id='dfFormulaTabsCleanV1Style';
    s.textContent=[
      /* Vendedor nunca vaza para Formulação/OPs/Backup. */
      '#pgFo:not(.dfCleanWhatsOnly) #dfVendedorCard{display:none!important}',
      /* Backup nunca vaza para Formulação/OPs/WhatsApp. */
      '#pgFo:not(.dfCleanBackupOnly) #dfCloudBackupCard{display:none!important}',
      /* Nas telas exclusivas, mantém somente a navegação e o quadro correto. */
      '#pgFo.dfCleanWhatsOnly > *:not(.dfAutoTopics):not(#dfVendedorCard){display:none!important}',
      '#pgFo.dfCleanWhatsOnly > #dfVendedorCard{display:block!important}',
      '#pgFo.dfCleanBackupOnly > *:not(.dfAutoTopics):not(#dfCloudBackupCard){display:none!important}',
      '#pgFo.dfCleanBackupOnly > #dfCloudBackupCard{display:block!important}',
      /* Barra estável no computador. */
      '#pgFo > .dfAutoTopics{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:7px!important;overflow:visible!important}',
      '#pgFo > .dfAutoTopics .dfAutoTopic{width:100%!important;min-width:0!important;white-space:normal!important;line-height:1.15!important}',
      '#pgFo > .dfAutoTopics [data-df-nav-menu="1"]{order:1}',
      '#pgFo > .dfAutoTopics [data-df-formula-top="1"]{order:2}',
      '#pgFo > .dfAutoTopics [data-df-nav-ops="1"]{order:3}',
      '#pgFo > .dfAutoTopics [data-df-nav-whats="1"]{order:4}',
      '#pgFo > .dfAutoTopics [data-df-nav-backup="1"]{order:5}',
      /* No celular: MENU em cima e, logo abaixo, FORMULAÇÃO + WHATSAPP + BACKUP lado a lado. */
      '@media(max-width:560px){#pgFo > .dfAutoTopics{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}#pgFo > .dfAutoTopics [data-df-nav-menu="1"]{grid-column:1 / -1!important;order:1!important}#pgFo > .dfAutoTopics [data-df-formula-top="1"]{grid-column:auto!important;order:2!important}#pgFo > .dfAutoTopics [data-df-nav-whats="1"]{grid-column:auto!important;order:3!important}#pgFo > .dfAutoTopics [data-df-nav-backup="1"]{grid-column:auto!important;order:4!important}#pgFo > .dfAutoTopics [data-df-nav-ops="1"]{display:none!important}#pgFo > .dfAutoTopics .dfAutoTopic{font-size:9px!important;min-height:44px!important;padding-left:4px!important;padding-right:4px!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  function page(){return $('pgFo')}
  function nav(){const p=page();return p&&p.querySelector(':scope > .dfAutoTopics')}
  function buttons(){const n=nav();return n?Array.from(n.querySelectorAll('.dfAutoTopic')):[]}
  function findWhats(){return buttons().find(b=>norm(b.textContent).includes('WHATSAPP'))||null}
  function findBackup(){return buttons().find(b=>norm(b.textContent).includes('BACKUP NA NUVEM')||b.dataset.dfBackupTop==='1')||null}
  function findFormula(){return buttons().find(b=>b.dataset.dfFormulaTop==='1'||norm(b.textContent)==='FORMULAÇÃO'||norm(b.textContent)==='FORMULACAO')||null}
  function findOps(){return buttons().find(b=>norm(b.textContent).includes('OPS AUTOMATICAS')||norm(b.textContent).includes('OPS AUTOMÁTICAS'))||null}
  function findMenu(){return buttons().find(b=>norm(b.textContent).includes('MENU'))||null}
  function clearMode(){const p=page();if(!p)return;p.classList.remove('dfCleanWhatsOnly','dfCleanBackupOnly')}
  function markActive(target){const n=nav();if(!n)return;n.querySelectorAll('.dfAutoTopic').forEach(b=>b.classList.toggle('on',b===target))}

  function cleanLiteralNewline(){
    const p=page();if(!p)return;
    Array.from(p.childNodes).forEach(node=>{
      if(node.nodeType===3&&String(node.nodeValue||'').includes('\\n'))node.nodeValue=String(node.nodeValue||'').replace(/\\n/g,'');
    });
  }

  function tagNav(){
    const menu=findMenu(),formula=findFormula(),ops=findOps(),whats=findWhats(),backup=findBackup();
    if(menu)menu.dataset.dfNavMenu='1';
    if(formula)formula.dataset.dfFormulaTop='1';
    if(ops)ops.dataset.dfNavOps='1';
    if(whats)whats.dataset.dfNavWhats='1';
    if(backup)backup.dataset.dfNavBackup='1';
  }

  function ensureFormulaButton(){
    const n=nav();if(!n)return null;
    let formula=findFormula();
    if(!formula){
      formula=document.createElement('button');
      formula.type='button';formula.className='dfAutoTopic';formula.dataset.dfFormulaTop='1';formula.textContent='🧪 FORMULAÇÃO';
      n.appendChild(formula);
    }
    formula.dataset.dfFormulaTop='1';
    bindFormula(formula);
    tagNav();
    return formula;
  }

  function showWhats(btn){const p=page();if(!p)return;cleanLiteralNewline();p.classList.remove('dfCleanBackupOnly');p.classList.add('dfCleanWhatsOnly');markActive(btn);window.scrollTo(0,0)}
  function showBackup(btn){const p=page();if(!p)return;cleanLiteralNewline();p.classList.remove('dfCleanWhatsOnly');p.classList.add('dfCleanBackupOnly');markActive(btn);window.scrollTo(0,0)}
  function showFormula(btn){
    clearMode();cleanLiteralNewline();
    const form=$('dfFormTabCore');if(form)form.click();
    setTimeout(()=>{cleanLiteralNewline();const fresh=ensureFormulaButton();tagNav();markActive(fresh||btn)},0);
    window.scrollTo(0,0);
  }

  function bindFormula(formula){
    if(!formula||formula.dataset.dfCleanTabsBound)return;
    formula.dataset.dfCleanTabsBound='1';
    formula.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();showFormula(formula)},true);
  }

  function attachNavObserver(){
    const n=nav();if(!n)return;
    if(navObserver&&navObserver.__nav===n)return;
    if(navObserver)navObserver.disconnect();
    navObserver=new MutationObserver(()=>{
      clearTimeout(fixTimer);
      fixTimer=setTimeout(()=>{cleanLiteralNewline();ensureFormulaButton();tagNav();bind()},50);
    });
    navObserver.__nav=n;
    navObserver.observe(n,{childList:true});
  }

  function bind(){
    ensureStyle();
    const p=page(),n=nav();if(!p||!n)return false;
    cleanLiteralNewline();
    const formula=ensureFormulaButton(),whats=findWhats(),backup=findBackup();
    tagNav();

    bindFormula(formula);
    if(whats&&!whats.dataset.dfCleanTabsBound){whats.dataset.dfCleanTabsBound='1';whats.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();showWhats(whats)},true)}
    if(backup&&!backup.dataset.dfCleanTabsBound){backup.dataset.dfCleanTabsBound='1';backup.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();showBackup(backup)},true)}

    const form=$('dfFormTabCore'),ops=$('dfFormTabOps');
    [form,ops].forEach(btn=>{if(btn&&!btn.dataset.dfCleanTabsClear){btn.dataset.dfCleanTabsClear='1';btn.addEventListener('click',function(){clearMode();cleanLiteralNewline();setTimeout(()=>{cleanLiteralNewline();const f=ensureFormulaButton();tagNav();if(btn===form)markActive(f)},0)},true)}});

    const topOps=findOps();
    if(topOps&&!topOps.dataset.dfCleanTabsClear){topOps.dataset.dfCleanTabsClear='1';topOps.addEventListener('click',function(){clearMode();cleanLiteralNewline();setTimeout(()=>{tagNav();const current=findOps();if(current)markActive(current)},0)},true)}

    attachNavObserver();
    return true;
  }

  function start(){if(bind())return;let tries=0;const t=setInterval(()=>{tries++;if(bind()||tries>=20)clearInterval(t)},250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',()=>{bind();setTimeout(bind,300);setTimeout(bind,1000)},{once:true});
})();
