(function(){
  'use strict';
  if(window.__DF_RUNTIME_STABILITY_V4)return;
  window.__DF_RUNTIME_STABILITY_V4=true;

  const OPS_KEY='df_formula_ops_auto_v2';
  let saveWatch=0,lastHandled='';
  const $=id=>document.getElementById(id);
  const validQr=v=>/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim());

  function localYmd(value){
    const d=value?new Date(value):new Date();
    if(Number.isNaN(d.getTime()))return '';
    const p=n=>String(n).padStart(2,'0');
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
  }
  function loadOps(){try{const a=JSON.parse(localStorage.getItem(OPS_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
  function saveOps(a){try{localStorage.setItem(OPS_KEY,JSON.stringify(a));return true}catch(e){return false}}

  function completionStamp(o){return o?.manualConfirmedAt||o?.cloudSyncedAt||o?.updatedAt||o?.createdAt||''}
  function shouldNormalize(o){
    if(!o||!validQr(o.qr||o.id))return false;
    if(o.manualConfirmed||o.source==='foto-equipe'||/^foto\+recuperacao-prontas/i.test(String(o.source||'')))return true;
    return String(o.status||'')==='ok'&&Number(o.produzido)>0&&completionStamp(o);
  }
  function normalizeDates(){
    const a=loadOps();let changed=false;
    for(const o of a){
      if(!shouldNormalize(o))continue;
      const correct=localYmd(completionStamp(o));
      if(correct&&o.data!==correct){o.data=correct;changed=true}
    }
    if(changed)saveOps(a);
    return changed;
  }

  function ensureStyle(){
    if($('dfRuntimeStableStyleV4'))return;
    const s=document.createElement('style');s.id='dfRuntimeStableStyleV4';
    s.textContent='button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}input,textarea,select{font-size:16px}#dfOpFastBadge{display:inline-block;margin-top:9px;border:1px solid #166534;background:#0b2417;color:#86efac;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:950}';
    document.head.appendChild(s);
  }

  function cleanOpUi(){
    ensureStyle();
    const hero=document.querySelector('#dfFormulaOps .dfOpsHero');
    if(hero){
      const h=hero.querySelector('h2');if(h)h.textContent='📸 OP + QR';
      const p=hero.querySelector(':scope > p');if(p)p.textContent='Fotografe a OP, confirme somente PRODUÇÃO TOTAL e APARA TOTAL e salve. O QR identifica a ordem e a foto é enviada para a nuvem da equipe.';
      if(!$('dfOpFastBadge')){const b=document.createElement('div');b.id='dfOpFastBadge';b.textContent='⚡ MODO RÁPIDO • SEM OCR PESADO';hero.appendChild(b)}
    }
    const ready=document.querySelector('#dfPaneOk h3');if(ready)ready.textContent='OPs concluídas';
    const note=document.querySelector('#dfPaneArchive .dfOpsCard > .dfOpsTiny');
    if(note&&/neste teste|armazenamento interno/i.test(note.textContent||''))note.textContent='A cópia local fica neste aparelho. Quando a equipe está conectada, a foto também fica salva na nuvem.';
    const old=$('dfOpQualityBar');if(old)old.remove();
  }

  // Atualiza os totais/listas sem trocar de aba e sem jogar a tela para o topo.
  function refreshOpViews(rec){
    const y=window.scrollY||window.pageYOffset||0,month=$('dfOpMonth');
    if(month){
      // Só muda o mês automaticamente quando o usuário ainda está no mês atual/vazio.
      if(!month.value&&rec?.data)month.value=String(rec.data).slice(0,7);
      try{month.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
    }
    try{window.DFOpTeamDateCanonical?.run?.()}catch(e){}
    try{sessionStorage.removeItem('df_op_manual_saved')}catch(e){}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{try{window.scrollTo(0,y)}catch(e){}}));
  }

  function findRecent(started){
    return loadOps().find(o=>{
      if(!o||!o.manualConfirmed)return false;
      const t=Date.parse(o.manualConfirmedAt||o.updatedAt||o.createdAt||'');
      return Number.isFinite(t)&&t>=started-1500;
    })||null;
  }
  function settleManualSave(started,attempt){
    const rec=findRecent(started);
    if(rec){
      const key=String(rec.id||'')+'|'+String(rec.manualConfirmedAt||rec.updatedAt||'');
      normalizeDates();
      if(key!==lastHandled){
        lastHandled=key;
        const fresh=loadOps().find(o=>o&&o.id===rec.id)||rec;
        try{window.dispatchEvent(new CustomEvent('df-op-saved',{detail:{record:fresh}}))}catch(e){}
        refreshOpViews(fresh);
      }
      return;
    }
    if(attempt<7)saveWatch=setTimeout(()=>settleManualSave(started,attempt+1),180+attempt*90);
  }

  document.addEventListener('click',function(e){
    if(e.target?.closest?.('#dfManualSave')){clearTimeout(saveWatch);settleManualSave(Date.now(),0)}
  },true);
  window.addEventListener('df-op-save-ui-refresh',function(e){normalizeDates();refreshOpViews(e?.detail?.record||null)});
  window.addEventListener('df-op-remote-merged',function(){if(normalizeDates())refreshOpViews(null)});
  window.addEventListener('df-op-cloud-synced',function(){normalizeDates();cleanOpUi()});
  window.addEventListener('df-op-lifecycle-updated',function(){normalizeDates();refreshOpViews(null)});
  window.addEventListener('df-ui-ready',()=>setTimeout(()=>{normalizeDates();cleanOpUi()},80));
  window.addEventListener('pageshow',()=>setTimeout(()=>{normalizeDates();cleanOpUi()},80));

  function boot(){normalizeDates();cleanOpUi();setTimeout(cleanOpUi,500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
