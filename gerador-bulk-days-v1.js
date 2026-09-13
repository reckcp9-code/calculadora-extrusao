(function(){
  'use strict';
  if(window.__DF_BULK_DAYS_V1)return;
  window.__DF_BULK_DAYS_V1=true;

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const DAY=86400000;
  const AUTO_DONE_KEY='df_bulk_plus5_20260914_done_v1';
  const AUTO_PROGRESS_KEY='df_bulk_plus5_20260914_progress_v1';
  let items=[];
  let busy=false;
  const originalFetch=window.fetch.bind(window);

  function secret(){const el=document.getElementById('secret');return String(el&&el.value||'').trim()}
  function eligible(it){return !!(it&&it.id&&String(it.expiresAt||'').trim())}
  function currentDays(it){
    const t=Date.parse(String(it&&it.expiresAt||''));
    if(!Number.isFinite(t))return 0;
    const left=t-Date.now();
    return left>0?Math.ceil(left/DAY):0;
  }
  async function setDays(it,extra){
    const sec=secret();if(!sec)throw new Error('Digite a senha administrativa.');
    const total=Math.max(0,currentDays(it))+extra;
    const r=await originalFetch(API+'/admin/access/set-days',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Admin':sec},body:JSON.stringify({keyId:it.id,days:total}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false)throw new Error(j.error||('Erro HTTP '+r.status));
    return j;
  }
  function msg(text,ok){const el=document.getElementById('dfBulkDaysMsg');if(!el)return;el.textContent=text;el.style.color=ok?'#86efac':'#fca5a5'}
  function loadProgress(){try{return new Set(JSON.parse(localStorage.getItem(AUTO_PROGRESS_KEY)||'[]'))}catch(e){return new Set()}}
  function saveProgress(set){try{localStorage.setItem(AUTO_PROGRESS_KEY,JSON.stringify(Array.from(set)))}catch(e){}}

  async function addToAll(extra,auto){
    extra=Number(extra);
    if(!Number.isInteger(extra)||extra<1||extra>3650){msg('Digite um número de dias entre 1 e 3650.',false);return}
    if(busy)return;
    const list=items.filter(eligible);
    if(!list.length){msg('Nenhum acesso com prazo encontrado ainda. Atualize os acessos.',false);return}
    if(!secret()){msg('Digite a senha administrativa para aplicar os dias.',false);return}
    if(!auto&&!confirm('Adicionar +'+extra+' dia(s) a TODOS os acessos que já possuem prazo, incluindo os vencidos?'))return;
    busy=true;
    const btn=document.getElementById('dfBulkDaysBtn');if(btn){btn.disabled=true;btn.textContent='APLICANDO...'}
    let ok=0,fail=0,skip=0;
    const progress=auto?loadProgress():new Set();
    for(const it of list){
      const id=String(it.id);
      if(auto&&progress.has(id)){skip++;continue}
      try{await setDays(it,extra);ok++;if(auto){progress.add(id);saveProgress(progress)}}catch(e){fail++}
    }
    busy=false;
    if(btn){btn.disabled=false;btn.textContent='DAR + DIAS PARA TODOS'}
    if(auto&&fail===0){try{localStorage.setItem(AUTO_DONE_KEY,'1')}catch(e){}}
    msg('Concluído: '+ok+' atualizado(s)'+(skip?' • '+skip+' já aplicado(s)':'')+(fail?' • '+fail+' falhou(aram)':'' )+'.',fail===0);
    const refresh=document.getElementById('usedBtn');if(refresh&&!refresh.disabled)setTimeout(()=>{try{refresh.click()}catch(e){}},400);
  }

  function addStyle(){
    if(document.getElementById('dfBulkDaysStyle'))return;
    const s=document.createElement('style');s.id='dfBulkDaysStyle';
    s.textContent='.dfBulkDaysBox{margin:12px 0;padding:13px;border:1px solid #7c3aed;background:#160c2a;border-radius:14px}.dfBulkDaysTitle{font-size:12px;font-weight:1000;color:#e9d5ff;margin-bottom:5px}.dfBulkDaysSub{font-size:11px;color:#c4b5fd;line-height:1.45;margin-bottom:10px}.dfBulkDaysRow{display:grid;grid-template-columns:minmax(90px,130px) 1fr;gap:8px}.dfBulkDaysRow input{margin:0}.dfBulkDaysRow button{margin:0;border:1px solid #8b5cf6;background:#24123f;color:#ede9fe;border-radius:10px;font-weight:1000}.dfBulkQuick{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}.dfBulkQuick button{border:1px solid #6d28d9;background:#1e1038;color:#ddd6fe;border-radius:9px;padding:8px;font:900 10px system-ui}.dfBulkDaysMsg{font-size:11px;margin-top:8px;color:#94a3b8}@media(max-width:560px){.dfBulkDaysRow{grid-template-columns:1fr}.dfBulkQuick{grid-template-columns:1fr 1fr}}';
    document.head.appendChild(s);
  }
  function ensureUI(){
    addStyle();
    const usedMsg=document.getElementById('usedMsg');if(!usedMsg||document.getElementById('dfBulkDaysBox'))return;
    const box=document.createElement('div');box.id='dfBulkDaysBox';box.className='dfBulkDaysBox';
    box.innerHTML='<div class="dfBulkDaysTitle">DAR MAIS DIAS PARA TODOS</div><div class="dfBulkDaysSub">Soma dias ao prazo atual de quem já está usando e também renova quem já venceu. Acessos sem prazo ficam sem alteração.</div><div class="dfBulkDaysRow"><input id="dfBulkDaysInput" type="number" min="1" max="3650" step="1" inputmode="numeric" value="5"><button id="dfBulkDaysBtn" type="button">DAR + DIAS PARA TODOS</button></div><div class="dfBulkQuick"><button type="button" data-bulk-extra="5">+ 5 DIAS</button><button type="button" data-bulk-extra="7">+ 7 DIAS</button><button type="button" data-bulk-extra="15">+ 15 DIAS</button><button type="button" data-bulk-extra="30">+ 30 DIAS</button></div><div id="dfBulkDaysMsg" class="dfBulkDaysMsg"></div>';
    usedMsg.insertAdjacentElement('afterend',box);
    document.getElementById('dfBulkDaysBtn').onclick=()=>addToAll(Number(document.getElementById('dfBulkDaysInput').value),false);
    box.querySelectorAll('[data-bulk-extra]').forEach(b=>b.onclick=()=>{document.getElementById('dfBulkDaysInput').value=b.dataset.bulkExtra;addToAll(Number(b.dataset.bulkExtra),false)});
  }
  function maybeAutoPlus5(){
    let done='';try{done=localStorage.getItem(AUTO_DONE_KEY)||''}catch(e){}
    if(done==='1'||busy||!secret()||!items.filter(eligible).length)return;
    msg('Aplicando automaticamente +5 dias para os acessos atuais e vencidos...',true);
    addToAll(5,true);
  }

  window.fetch=async function(input,init){
    const response=await originalFetch(input,init);
    try{
      const u=new URL(typeof input==='string'?input:input.url,location.href);
      if(u.pathname==='/admin/access/list-used'&&response.ok){
        response.clone().json().then(j=>{if(j&&Array.isArray(j.items)){items=j.items;ensureUI();setTimeout(maybeAutoPlus5,180)}}).catch(()=>{});
      }
    }catch(e){}
    return response;
  };

  function init(){ensureUI();setInterval(()=>{ensureUI();maybeAutoPlus5()},1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
