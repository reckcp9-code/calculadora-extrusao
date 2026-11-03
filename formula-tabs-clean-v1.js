(function(){
  'use strict';
  if(window.DFFormulaTabsCleanV1)return;
  window.DFFormulaTabsCleanV1=true;

  const $=id=>document.getElementById(id);
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
  let navObserver=null,pageObserver=null,rootObserver=null,fixTimer=0,cleaning=false,repairing=false;

  function ensureStyle(){
    if($('dfFormulaTabsCleanV1Style'))return;
    const s=document.createElement('style');
    s.id='dfFormulaTabsCleanV1Style';
    s.textContent=[
      '#pgFo #dfFormTabCore,#pgFo #dfFormulaSubnav{display:none!important}',
      '#pgFo:not(.dfCleanWhatsOnly) #dfVendedorCard{display:none!important}',
      '#pgFo:not(.dfCleanBackupOnly) #dfCloudBackupCard{display:none!important}',
      '#pgFo.dfCleanWhatsOnly > *:not(.dfAutoTopics):not(#dfVendedorCard){display:none!important}',
      '#pgFo.dfCleanWhatsOnly > #dfVendedorCard{display:block!important}',
      '#pgFo.dfCleanBackupOnly > *:not(.dfAutoTopics):not(#dfCloudBackupCard){display:none!important}',
      '#pgFo.dfCleanBackupOnly > #dfCloudBackupCard{display:block!important}',
      '#pgFo > .dfAutoTopics{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important;overflow:visible!important}',
      '#pgFo > .dfAutoTopics .dfAutoTopic{width:100%!important;min-width:0!important;white-space:normal!important;line-height:1.15!important}',
      '#pgFo > .dfAutoTopics [data-df-nav-menu="1"]{order:1}',
      '#pgFo > .dfAutoTopics [data-df-formula-top="1"]{order:2}',
      '#pgFo > .dfAutoTopics [data-df-nav-ops="1"]{order:3;display:block!important;flex:0 0 auto!important;min-width:145px!important}',
      '#pgFo > .dfAutoTopics [data-df-nav-ops="1"].on{background:#ffb51b!important;background-image:linear-gradient(135deg,#ffd05b,#f5a000)!important;border-color:#f5a000!important;color:#101827!important;box-shadow:0 0 0 1px rgba(245,160,0,.3)!important}',
      '#pgFo > .dfAutoTopics [data-df-nav-whats="1"]{display:none!important}',
      '#pgFo > .dfAutoTopics [data-df-nav-backup="1"]{order:5}',
      '@media(max-width:560px){#pgFo > .dfAutoTopics{display:flex!important;gap:7px!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;grid-template-columns:none!important;padding-bottom:2px!important}#pgFo > .dfAutoTopics::-webkit-scrollbar{display:none!important}#pgFo > .dfAutoTopics .dfAutoTopic{flex:0 0 auto!important;width:auto!important;min-width:145px!important;white-space:nowrap!important;font-size:10px!important;min-height:44px!important;padding-left:12px!important;padding-right:12px!important}#pgFo > .dfAutoTopics [data-df-nav-menu="1"]{min-width:110px!important;order:1!important}#pgFo > .dfAutoTopics [data-df-formula-top="1"]{order:2!important}#pgFo > .dfAutoTopics [data-df-nav-whats="1"]{display:none!important}#pgFo > .dfAutoTopics [data-df-nav-backup="1"]{order:4!important}#pgFo > .dfAutoTopics [data-df-nav-ops="1"]{display:block!important;order:3!important}}'
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
    const p=page();if(!p||cleaning)return;cleaning=true;
    try{
      const w=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);
      const nodes=[];let n;while((n=w.nextNode()))nodes.push(n);
      nodes.forEach(node=>{const v=String(node.nodeValue||'');if(v.includes('\\n'))node.nodeValue=v.replace(/\\n/g,'')});
    }catch(e){}
    cleaning=false;
  }

  function tagNav(){
    const n=nav();if(!n||repairing)return;
    repairing=true;
    try{
    const menu=findMenu(),formula=findFormula(),backup=findBackup(),whats=findWhats();
    const ops=n.querySelector('#dfFormTabOps');if(ops){ops.dataset.dfNavOps='1';ops.classList.add('dfAutoTopic');ops.hidden=false;ops.style.removeProperty('display')}
    if(menu)menu.dataset.dfNavMenu='1';
    if(formula)formula.dataset.dfFormulaTop='1';
    if(backup)backup.dataset.dfNavBackup='1';
    if(whats){whats.remove();}
    removeDuplicateFormulaTab();
    }finally{repairing=false}
  }
    function removeDuplicateFormulaTab(){
    const p=page(),top=nav();if(!p||!top)return;
    // O botão superior permanece. Somente a duplicata da segunda linha é removida.
    const lower=p.querySelector('#dfFormTabCore');
    if(lower&&lower.parentElement!==top){
      lower.style.setProperty('display','none','important');
      lower.setAttribute('aria-hidden','true');
      lower.tabIndex=-1;
    }
  }
    function ensureFormulaButton(){const n=nav();if(!n)return null;let formula=findFormula();if(!formula){formula=document.createElement('button');formula.type='button';formula.className='dfAutoTopic';formula.dataset.dfFormulaTop='1';formula.textContent='🧪 FORMULAÇÃO';n.appendChild(formula)}formula.dataset.dfFormulaTop='1';tagNav();return formula}
  function showWhats(btn){const p=page();if(!p)return;cleanLiteralNewline();p.classList.remove('dfCleanBackupOnly');p.classList.add('dfCleanWhatsOnly');markActive(btn);window.scrollTo(0,0)}
  function showBackup(btn){const p=page();if(!p)return;cleanLiteralNewline();p.classList.remove('dfCleanWhatsOnly');p.classList.add('dfCleanBackupOnly');markActive(btn);window.scrollTo(0,0)}
  function showFormula(btn){clearMode();cleanLiteralNewline();const form=$('dfFormTabCore');if(form)form.click();setTimeout(()=>{cleanLiteralNewline();const fresh=ensureFormulaButton();tagNav();markActive(fresh||btn)},0);window.scrollTo(0,0)}
  function attachNavObserver(){const n=nav();if(!n)return;if(navObserver&&navObserver.__nav===n)return;if(navObserver)navObserver.disconnect();navObserver=new MutationObserver(()=>{clearTimeout(fixTimer);fixTimer=setTimeout(()=>{if(!repairing){cleanLiteralNewline();ensureFormulaButton();tagNav()}},50)});navObserver.__nav=n;navObserver.observe(n,{childList:true,subtree:true,characterData:true})}
  function attachPageObserver(){const p=page();if(!p)return;if(pageObserver&&pageObserver.__page===p)return;if(pageObserver)pageObserver.disconnect();pageObserver=new MutationObserver(()=>{if(cleaning)return;clearTimeout(fixTimer);fixTimer=setTimeout(()=>{cleanLiteralNewline();if(!repairing){ensureFormulaButton();tagNav()}},40)});pageObserver.__page=p;pageObserver.observe(p,{childList:true,subtree:true,characterData:true})}

  function bind(){
    attachRootObserver();ensureStyle();
    const p=page(),n=nav();if(!p||!n)return false;
    cleanLiteralNewline();ensureFormulaButton();tagNav();
    // Um único handler no elemento da página, e não em cada botão.
    // O menu reconstrói seus tópicos ao voltar de Produção: handlers
    // individuais presos aos botões antigos deixavam BACKUP sem clique.
    if(p.dataset.dfFormulaNavDelegated!=='1'){
      p.dataset.dfFormulaNavDelegated='1';
      p.addEventListener('click',function(e){
        const btn=e.target?.closest?.('.dfAutoTopic');
        const currentNav=nav();
        if(!btn||!currentNav||!currentNav.contains(btn))return;
        const label=norm(btn.textContent);
        const isOps=btn.id==='dfFormTabOps'||btn.dataset.dfNavOps==='1';
        const isBackup=btn.dataset.dfNavBackup==='1'||label.includes('BACKUP NA NUVEM');
        const isFormula=btn.dataset.dfFormulaTop==='1'||label==='FORMULAÇÃO';
        if(!isOps&&!isBackup&&!isFormula)return;
        e.preventDefault();e.stopImmediatePropagation();
        if(isOps){
          clearMode();
          window.__dfOpenFormulaOpsAfterLoad=true;
          window.DFFormulaOpsUI?.open?.();
          markActive(btn);
          window.scrollTo(0,0);
          return;
        }
        window.__dfOpenFormulaOpsAfterLoad=false;
        window.DFFormulaOpsUI?.close?.();
        if(isBackup)showBackup(btn);
        else showFormula(btn);
      },true);
    }
    attachNavObserver();attachPageObserver();return true;
  }
  // Observe somente a troca do contêiner de navegação. O app pode recriar
  // #pgFo/.dfAutoTopics depois da inicialização ou ao retomar do cache iOS.
  function attachRootObserver(){
    if(rootObserver||!document.body)return;
    rootObserver=new MutationObserver(()=>{
      const n=nav();
      if(!n)return;
      if(!n.querySelector('[data-df-formula-top="1"]')){
        clearTimeout(fixTimer);
        fixTimer=setTimeout(()=>{ensureFormulaButton();tagNav()},80);
      }
    });
    rootObserver.observe(document.body,{childList:true,subtree:true});
  }
  attachRootObserver();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attachRootObserver,{once:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)bind()});
  window.addEventListener('pageshow',()=>bind());
  window.addEventListener('df-formula-section-entered',()=>bind());
  function retry(attempt){attempt=Number(attempt)||0;cleanLiteralNewline();if(bind()||attempt>=12)return;setTimeout(()=>retry(attempt+1),300)}
  function start(){retry(0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',()=>{cleanLiteralNewline();bind();setTimeout(()=>{cleanLiteralNewline();bind()},120);setTimeout(()=>{cleanLiteralNewline();bind()},550)},{once:true});
})();
