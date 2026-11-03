(function(){
  'use strict';
  if(window.DFProductionNowV157)return;
  window.DFProductionNowV157=true;

  const KEY='df_production_now_v1';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const load=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}};
  const save=a=>{try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}render()};
  const now=()=>new Date().toISOString();
  const hm=iso=>{const d=new Date(iso||Date.now());return Number.isNaN(d.getTime())?'—':d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};

  function style(){
    if($('dfProdNowStyle'))return;
    const s=document.createElement('style');s.id='dfProdNowStyle';s.textContent=`
      #dfPaneNow{display:none}#dfPaneNow.on{display:block}
      .dfNowHead{border:1px solid #2563eb;background:linear-gradient(180deg,#0b1f42,#101827);border-radius:18px;padding:14px;margin-bottom:12px}
      .dfNowHead h3{margin:0 0 5px;color:#bfdbfe}.dfNowHead p{margin:0;color:#94a3b8;font-size:11px;line-height:1.45}
      .dfNowKpis{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.dfNowKpi{background:#0f172a;border:1px solid #263244;border-radius:13px;padding:10px}.dfNowKpi span{display:block;color:#94a3b8;font-size:9px;font-weight:800}.dfNowKpi b{display:block;font-size:20px;margin-top:3px}
      .dfNowCard{border:1px solid #263244;background:#0f172a;border-radius:16px;padding:13px;margin-top:9px}.dfNowCard.run{border-color:#166534}.dfNowCard.stop{border-color:#7f1d1d}.dfNowCard.adjust{border-color:#a16207}
      .dfNowTop{display:flex;gap:8px;justify-content:space-between;align-items:flex-start}.dfNowMachine{font-size:17px;font-weight:950;color:#f8fafc}.dfNowBadge{border-radius:999px;padding:5px 9px;font-size:10px;font-weight:950;white-space:nowrap}.dfNowBadge.run{background:#0c321c;color:#86efac}.dfNowBadge.stop{background:#230b0b;color:#fca5a5}.dfNowBadge.adjust{background:#3a2605;color:#fde68a}.dfNowBadge.final{background:#172033;color:#cbd5e1}
      .dfNowProduct{font-size:20px;font-weight:950;color:#ffd36a;margin:8px 0 5px}.dfNowMeta{color:#cbd5e1;font-size:11px;line-height:1.55}.dfNowActions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.dfNowActions button{border:1px solid #334155;background:#111827;color:#e2e8f0;border-radius:10px;padding:9px;font-size:11px;font-weight:900}.dfNowActions .done{border-color:#7f1d1d;color:#fca5a5}
      #dfNowForm{border:1px solid #f5a000;background:#17120a;border-radius:16px;padding:13px;margin-top:12px}#dfNowForm h4{margin:0 0 8px;color:#ffd36a}#dfNowForm .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}#dfNowForm label{display:block;color:#cbd5e1;font-size:10px;font-weight:850;margin:6px 0 4px}#dfNowForm input,#dfNowForm select{width:100%;box-sizing:border-box;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:10px;font-size:14px}#dfNowSave{width:100%;margin-top:10px;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:11px;padding:12px;font-weight:950}.dfNowNote{margin-top:8px;color:#94a3b8;font-size:10px;line-height:1.4}
      @media(max-width:430px){.dfNowKpis{grid-template-columns:repeat(3,1fr)}#dfNowForm .grid{grid-template-columns:1fr 1fr}.dfNowProduct{font-size:18px}}
    `;document.head.appendChild(s);
  }

  function statusClass(s){s=String(s||'').toLowerCase();if(s==='rodando')return'run';if(s==='parada')return'stop';if(s==='ajuste'||s==='troca de material')return'adjust';return'final'}

  function build(){
    return `<div class="dfNowHead"><h3>🏭 PRODUÇÃO AGORA</h3><p>Veja rapidamente o que está rodando em cada máquina neste momento.</p><div class="dfNowKpis"><div class="dfNowKpi"><span>RODANDO</span><b id="dfNowRunning">0</b></div><div class="dfNowKpi"><span>PARADAS</span><b id="dfNowStopped">0</b></div><div class="dfNowKpi"><span>AJUSTE</span><b id="dfNowAdjust">0</b></div></div></div><div id="dfNowList"></div><div id="dfNowForm"><h4>ATUALIZAR MÁQUINA</h4><div class="grid"><div><label>MÁQUINA</label><input id="dfNowMachine" placeholder="Ex.: Máquina 1"></div><div><label>STATUS</label><select id="dfNowStatus"><option>RODANDO</option><option>PARADA</option><option>AJUSTE</option><option>TROCA DE MATERIAL</option><option>FINALIZADA</option></select></div><div><label>PRODUTO</label><input id="dfNowProduct" placeholder="Ex.: 100 litros"></div><div><label>OP</label><input id="dfNowOp" placeholder="Ex.: DFOP-..."></div><div><label>OPERADOR</label><input id="dfNowOperator" placeholder="Nome do operador"></div><div><label>INÍCIO</label><input id="dfNowStart" type="time"></div></div><button id="dfNowSave" type="button">✅ SALVAR / ATUALIZAR STATUS</button><div class="dfNowNote">Status de produção deste aparelho. A sincronização em tempo real entre operador e dono será ligada em uma próxima etapa.</div></div>`;
  }

  function mount(){
    style();const ops=$('dfFormulaOps'),tabs=ops&&ops.querySelector('.dfOpsTabs');if(!ops||!tabs)return false;
    if(!$('dfNowTab')){const b=document.createElement('button');b.id='dfNowTab';b.dataset.pane='now';b.textContent='🏭 AGORA';tabs.appendChild(b)}
    if(!$('dfPaneNow')){const p=document.createElement('div');p.id='dfPaneNow';p.className='dfOpsPane';p.innerHTML=build();const first=ops.querySelector('.dfOpsPane');if(first)ops.insertBefore(p,first);else ops.appendChild(p)}
    $('dfNowTab').onclick=()=>openNow();
    $('dfNowSave').onclick=saveForm;
    $('dfNowStart').value=new Date().toTimeString().slice(0,5);
    render();return true;
  }
  function openNow(){document.querySelectorAll('#dfFormulaOps .dfOpsTabs button').forEach(b=>b.classList.toggle('on',b.id==='dfNowTab'));document.querySelectorAll('#dfFormulaOps .dfOpsPane').forEach(p=>p.classList.remove('on'));$('dfPaneNow')?.classList.add('on');render()}
  function render(){const list=$('dfNowList');if(!list)return;const a=load(),active=a.filter(x=>x.status!=='FINALIZADA');$('dfNowRunning').textContent=active.filter(x=>x.status==='RODANDO').length;$('dfNowStopped').textContent=active.filter(x=>x.status==='PARADA').length;$('dfNowAdjust').textContent=active.filter(x=>x.status==='AJUSTE'||x.status==='TROCA DE MATERIAL').length;list.innerHTML=active.length?active.map(x=>{const c=statusClass(x.status);return `<div class="dfNowCard ${c}" data-id="${esc(x.id)}"><div class="dfNowTop"><div class="dfNowMachine">${esc(x.machine||'Máquina')}</div><span class="dfNowBadge ${c}">${esc(x.status||'')}</span></div><div class="dfNowProduct">${esc(x.product||'Sem produto informado')}</div><div class="dfNowMeta">OP: <b>${esc(x.op||'—')}</b><br>Operador: <b>${esc(x.operator||'—')}</b><br>Início: <b>${hm(x.startedAt)}</b> • Atualizado: <b>${hm(x.updatedAt)}</b></div><div class="dfNowActions"><button data-edit="${esc(x.id)}">✏️ EDITAR</button><button class="done" data-done="${esc(x.id)}">⏹ FINALIZAR</button></div></div>`}).join(''):'<div class="dfOpsStatus">Nenhuma máquina marcada como ativa agora.</div>';list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));list.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>finish(b.dataset.done))}
  function edit(id){const x=load().find(v=>v.id===id);if(!x)return;$('dfNowMachine').value=x.machine||'';$('dfNowStatus').value=x.status||'RODANDO';$('dfNowProduct').value=x.product||'';$('dfNowOp').value=x.op||'';$('dfNowOperator').value=x.operator||'';try{$('dfNowStart').value=new Date(x.startedAt||Date.now()).toTimeString().slice(0,5)}catch(e){}$('dfNowForm').dataset.edit=id;$('dfNowForm').scrollIntoView({behavior:'smooth',block:'center'})}
  function finish(id){const a=load(),i=a.findIndex(x=>x.id===id);if(i<0)return;a[i].status='FINALIZADA';a[i].updatedAt=now();save(a)}
  function saveForm(){const machine=String($('dfNowMachine').value||'').trim(),product=String($('dfNowProduct').value||'').trim();if(!machine){alert('Digite a máquina.');return}if(!product&&$('dfNowStatus').value==='RODANDO'){alert('Digite o produto que está rodando.');return}const a=load(),id=$('dfNowForm').dataset.edit||('m-'+Date.now()),i=a.findIndex(x=>x.id===id),t=$('dfNowStart').value||new Date().toTimeString().slice(0,5),d=new Date();const parts=t.split(':');d.setHours(+parts[0]||0,+parts[1]||0,0,0);const rec={id,machine,status:$('dfNowStatus').value,product,op:String($('dfNowOp').value||'').trim(),operator:String($('dfNowOperator').value||'').trim(),startedAt:i>=0?(a[i].startedAt||d.toISOString()):d.toISOString(),updatedAt:now()};if(i>=0)a[i]={...a[i],...rec};else a.unshift(rec);save(a);delete $('dfNowForm').dataset.edit;['dfNowMachine','dfNowProduct','dfNowOp','dfNowOperator'].forEach(k=>$(k).value='');$('dfNowStatus').value='RODANDO';$('dfNowStart').value=new Date().toTimeString().slice(0,5)}

  function boot(){let n=0;const t=setInterval(()=>{if(mount()||++n>40)clearInterval(t)},250);window.addEventListener('df-ui-ready',()=>setTimeout(mount,250));document.addEventListener('click',e=>{if(e.target?.id==='dfFormTabOps')setTimeout(mount,100)},true)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();