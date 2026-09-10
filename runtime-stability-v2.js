(function(){
  'use strict';

  const OPS_KEY='df_formula_ops_auto_v2';
  const TEAM_KEY='df_op_team_v1';
  let timer=0,lastOps='';

  const $=id=>document.getElementById(id);
  function localYmd(value){
    const d=value?new Date(value):new Date();
    if(Number.isNaN(d.getTime()))return '';
    const p=n=>String(n).padStart(2,'0');
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
  }
  function loadOps(){try{const a=JSON.parse(localStorage.getItem(OPS_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
  function saveOps(a){try{localStorage.setItem(OPS_KEY,JSON.stringify(a))}catch(e){}}
  function team(){try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}}

  function normalizeDates(){
    const raw=String(localStorage.getItem(OPS_KEY)||'');
    if(!raw||raw===lastOps)return false;
    let a;try{a=JSON.parse(raw)}catch(e){lastOps=raw;return false}
    if(!Array.isArray(a)){lastOps=raw;return false}
    let changed=false;
    for(const o of a){
      if(!o||typeof o!=='object')continue;
      const stamp=o.createdAt||o.manualConfirmedAt||o.updatedAt||'';
      if(!stamp)continue;
      const correct=localYmd(stamp);
      // Corrige registros criados em UTC que podem cair no dia/mês seguinte no Brasil.
      if(correct&&o.data!==correct&&(o.source==='foto+confirmacao-manual'||o.source==='foto-equipe')){
        o.data=correct;changed=true;
      }
    }
    if(changed){saveOps(a);lastOps=JSON.stringify(a)}else lastOps=raw;
    return changed;
  }

  function ensureStyle(){
    if($('dfRuntimeStableStyle'))return;
    const s=document.createElement('style');s.id='dfRuntimeStableStyle';
    s.textContent=`
      button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      #dfOpCloudState{margin-top:8px;border:1px solid #334155;background:#0a1628;border-radius:10px;padding:9px 10px;color:#cbd5e1;font-size:11px;font-weight:850;line-height:1.45}
      #dfOpCloudState.ok{border-color:#166534;color:#86efac;background:#0b2417}
      #dfOpCloudState.warn{border-color:#a16207;color:#fde68a;background:#241804}
      #dfOpFastBadge{display:inline-block;margin-top:9px;border:1px solid #166534;background:#0b2417;color:#86efac;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:950}
    `;
    document.head.appendChild(s);
  }

  function cleanOpUi(){
    ensureStyle();
    const hero=document.querySelector('#dfFormulaOps .dfOpsHero');
    if(hero){
      const h=hero.querySelector('h2');if(h)h.textContent='📸 OP + QR';
      const p=hero.querySelector(':scope > p');if(p)p.textContent='Fotografe a OP, confirme somente PRODUÇÃO TOTAL e APARA TOTAL e salve. O QR identifica a ordem e a foto é enviada para a nuvem da equipe.';
      if(!$('dfOpFastBadge')){const b=document.createElement('div');b.id='dfOpFastBadge';b.textContent='⚡ MODO RÁPIDO • SEM OCR PESADO';hero.insertBefore(b,$('dfOpTeamCloud')||null)}
    }
    const ready=document.querySelector('#dfPaneOk h3');if(ready)ready.textContent='OPs concluídas';
    const photoCard=document.querySelector('#dfPaneArchive .dfOpsCard');
    if(photoCard){
      const title=photoCard.querySelector('h3');if(title&&title.textContent.trim()==='Fotos arquivadas')title.textContent='Fotos arquivadas';
      const notes=photoCard.querySelectorAll('.dfOpsTiny');
      for(const n of notes){
        if(/neste (teste|aparelho)|armazenamento interno/i.test(n.textContent||''))n.textContent='A cópia local fica neste aparelho. Quando a equipe está conectada, a foto também é enviada para a nuvem e pode ser aberta em outros aparelhos da equipe.';
      }
    }
    const old=$('dfOpQualityBar');if(old)old.remove();
  }

  function cloudState(){
    const box=$('dfOpTeamCloud');if(!box)return;
    let st=$('dfOpCloudState');
    if(!st){st=document.createElement('div');st.id='dfOpCloudState';box.appendChild(st)}
    const t=team();
    if(!t||!t.teamId){st.textContent='☁️ Entre em uma equipe para enviar as fotos para a nuvem.';st.className='warn';return}
    const a=loadOps();
    const confirmed=a.filter(o=>o&&o.manualConfirmed&&o.status==='ok');
    const pending=confirmed.filter(o=>!o.cloudPhotoId);
    if(navigator.onLine===false){st.textContent='📴 Sem internet • '+pending.length+' foto(s) aguardando envio.';st.className='warn';return}
    if(pending.length){st.textContent='⏳ '+pending.length+' foto(s) aguardando envio para a nuvem. Não apague a foto ainda.';st.className='warn';return}
    if(confirmed.length){st.textContent='✅ Fotos sincronizadas na nuvem • pode apagar da galeria do celular.';st.className='ok';return}
    st.textContent='☁️ Nuvem pronta. A próxima OP salva será enviada automaticamente.';st.className='ok';
  }

  function refresh(){
    try{normalizeDates();cleanOpUi();cloudState()}catch(e){}
  }
  function schedule(ms){clearTimeout(timer);timer=setTimeout(refresh,ms||80)}

  // Garante a correção da data antes do reload que ocorre após SALVAR OP.
  document.addEventListener('click',e=>{
    if(e.target&&e.target.closest&&e.target.closest('#dfManualSave')){
      setTimeout(()=>{lastOps='';normalizeDates();cloudState()},120);
      setTimeout(()=>{lastOps='';normalizeDates();cloudState()},500);
    }
  },true);

  window.addEventListener('df-ui-ready',()=>schedule(80));
  window.addEventListener('online',()=>schedule(120));
  window.addEventListener('offline',()=>schedule(30));
  window.addEventListener('pageshow',()=>schedule(60));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(60)});
  document.addEventListener('click',e=>{
    if(e.target&&e.target.closest&&e.target.closest('#dfCloudRefresh,#dfCloudJoin,#dfCloudCreate,[data-pane="archive"]'))schedule(500);
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(100),{once:true});else schedule(100);
  // Verificação leve somente enquanto o app está visível.
  setInterval(()=>{if(!document.hidden)refresh()},6000);
})();
