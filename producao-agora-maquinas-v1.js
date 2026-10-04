(function(){
'use strict';
if(window.DF_PRODUCAO_AGORA_MAQUINAS_V2)return;window.DF_PRODUCAO_AGORA_MAQUINAS_V2=true;

const CAD_KEY='df_producao_cadastros_v1';
const AUTO_KEY='df_producao_ops_auto_v1';
const OPS_KEY='df_producao_ops_setores_test_v3';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const normId=v=>String(v||'').trim().toUpperCase().replace(/\s+/g,'');
const num=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
const fmt=v=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function localDay(d){const x=d instanceof Date?d:new Date(d);if(isNaN(x.getTime()))return'';return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
function today(){return localDay(new Date())}
function recordDay(r){if(r&&r.createdAt){const d=localDay(r.createdAt);if(d)return d}const s=String(r?.date||'').trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;return''}
function machines(){
  const out=[],seen=new Set(),cad=read(CAD_KEY,{});
  ['Picote','Sacoleira','Blocadora'].forEach(sec=>{
    const list=Array.isArray(cad?.[sec]?.machines)?cad[sec].machines:[];
    list.forEach(name=>{const n=String(name||'').trim(),k=norm(n);if(n&&!seen.has(k)){seen.add(k);out.push(n)}})
  });
  if(!out.length){
    const ops=read(OPS_KEY,[]);
    (Array.isArray(ops)?ops:[]).forEach(o=>{const n=String(o?.machine||'').trim(),k=norm(n);if(n&&!seen.has(k)){seen.add(k);out.push(n)}})
  }
  return out;
}
function totalsFor(machine){
  const key=norm(machine),day=today(),a=read(AUTO_KEY,[]);
  return (Array.isArray(a)?a:[]).filter(r=>r&&r.status==='ok'&&norm(r.machine)===key&&recordDay(r)===day).reduce((t,r)=>({production:t.production+num(r.production),scrap:t.scrap+num(r.scrap)}),{production:0,scrap:0})
}
let editingId='';
function addStyle(){if($('dfAgoraMachinesCss'))return;const s=document.createElement('style');s.id='dfAgoraMachinesCss';s.textContent=`
#dfPAPaneNow>.dfPACard{padding:16px}#dfPAPaneNow>.dfPACard>h3{font-size:22px;margin:0 0 6px}.dfAgoraSub{color:#94a3b8;font-size:12px;margin-bottom:12px}.dfAgoraMachine{border:1px solid #334155;background:#0f172a;border-radius:17px;padding:15px;margin-top:10px}.dfAgoraMachineName{font-size:18px;font-weight:950;color:#f8fafc;margin-bottom:11px}.dfAgoraTotals{display:grid;grid-template-columns:1fr 1fr;gap:9px}.dfAgoraKpi{border:1px solid #263244;background:#111827;border-radius:14px;padding:13px}.dfAgoraKpi span{display:block;color:#94a3b8;font-size:10px;font-weight:800}.dfAgoraKpi b{display:block;color:#fff;font-size:21px;margin-top:5px}.dfAgoraEmpty{border:1px dashed #475569;border-radius:15px;padding:16px;color:#94a3b8;text-align:center;margin-top:10px}.dfPAEditBtn{width:100%;border:1px solid #f5a000;background:#241600;color:#ffd36a;border-radius:13px;padding:13px 9px;margin-top:9px;font:950 13px/1.15 system-ui}.dfPAEditModal{position:fixed;inset:0;z-index:1000003;background:#020617f2;display:none;overflow:auto;padding:18px}.dfPAEditModal.on{display:block}.dfPAEditBox{max-width:560px;margin:40px auto;background:#111827;border:1px solid #334155;border-radius:20px;padding:16px}.dfPAEditBox h3{margin:0 0 5px;font-size:22px}.dfPAEditInfo{color:#94a3b8;font-size:12px;line-height:1.45;margin-bottom:12px}.dfPAEditGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.dfPAEditGrid label{display:block;color:#cbd5e1;font-size:11px;margin:0 0 5px}.dfPAEditGrid input{width:100%;border:1px solid #334155;background:#0f172a;color:#fff;border-radius:12px;padding:13px;font-size:17px}.dfPAEditSave,.dfPAEditClose{width:100%;min-height:50px;border-radius:13px;padding:12px;margin-top:10px;font:950 13px/1.15 system-ui}.dfPAEditSave{border:1px solid #16a34a;background:#0c321c;color:#86efac}.dfPAEditClose{border:1px solid #475569;background:#0f172a;color:#e2e8f0}.dfPAEditMsg{margin-top:9px;font-size:12px;font-weight:850}.dfPAEditMsg.bad{color:#fca5a5}.dfPAEditMsg.ok{color:#86efac}@media(max-width:640px){.dfPAEditGrid{grid-template-columns:1fr 1fr}}`;document.head.appendChild(s)}
function render(){
  const pane=$('dfPAPaneNow'),box=$('dfPANowList');if(!pane||!box||!pane.classList.contains('on'))return;
  addStyle();
  const title=pane.querySelector('.dfPACard>h3');if(title)title.textContent='Produção agora';
  const list=machines();
  if(!list.length){box.innerHTML='<div class="dfAgoraEmpty">Nenhuma máquina cadastrada.</div>';return}
  box.innerHTML='<div class="dfAgoraSub">Produção total e apara de hoje por máquina.</div>'+list.map(machine=>{const t=totalsFor(machine);return '<div class="dfAgoraMachine"><div class="dfAgoraMachineName">'+esc(machine)+'</div><div class="dfAgoraTotals"><div class="dfAgoraKpi"><span>PRODUÇÃO TOTAL</span><b>'+fmt(t.production)+' kg</b></div><div class="dfAgoraKpi"><span>APARA</span><b>'+fmt(t.scrap)+' kg</b></div></div></div>'}).join('');
}
function ensureEditModal(){addStyle();let m=$('dfPAEditModal');if(m)return m;m=document.createElement('div');m.id='dfPAEditModal';m.className='dfPAEditModal';m.innerHTML='<div class="dfPAEditBox"><h3>Editar OP pronta</h3><div id="dfPAEditInfo" class="dfPAEditInfo"></div><div class="dfPAEditGrid"><div><label>PRODUÇÃO TOTAL (kg)</label><input id="dfPAEditProduction" inputmode="decimal"></div><div><label>APARA (kg)</label><input id="dfPAEditScrap" inputmode="decimal"></div></div><button id="dfPAEditSave" class="dfPAEditSave" type="button">✅ SALVAR E MANTER EM PRONTAS</button><button id="dfPAEditClose" class="dfPAEditClose" type="button">FECHAR</button><div id="dfPAEditMsg" class="dfPAEditMsg"></div></div>';document.body.appendChild(m);$('dfPAEditClose').onclick=closeEdit;$('dfPAEditSave').onclick=saveEdit;m.addEventListener('click',e=>{if(e.target===m)closeEdit()});return m}
function readyRecord(id){const k=normId(id),a=read(AUTO_KEY,[]);return (Array.isArray(a)?a:[]).find(r=>r&&r.status==='ok'&&(normId(r.id)===k||normId(r.opId)===k))||null}
function openEdit(id){const r=readyRecord(id);if(!r)return;editingId=normId(r.opId||r.id);ensureEditModal();$('dfPAEditInfo').innerHTML='<b>'+esc(r.machine||'OP')+'</b><br>'+esc(r.product||'')+(r.measure?' • '+esc(r.measure):'')+'<br>'+esc(editingId);$('dfPAEditProduction').value=String(r.production??'').replace('.',',');$('dfPAEditScrap').value=String(r.scrap??'').replace('.',',');$('dfPAEditMsg').textContent='';$('dfPAEditModal').classList.add('on');document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';setTimeout(()=>$('dfPAEditProduction')?.focus(),30)}
function closeEdit(){const m=$('dfPAEditModal');if(m)m.classList.remove('on');editingId='';document.documentElement.style.overflow='';document.body.style.overflow=''}
function editMsg(text,ok){const m=$('dfPAEditMsg');if(!m)return;m.className='dfPAEditMsg '+(ok?'ok':'bad');m.textContent=text}
function saveEdit(){if(!editingId)return;const production=num($('dfPAEditProduction')?.value),scrap=num($('dfPAEditScrap')?.value);if(!(production>0))return editMsg('Informe a produção total.',false);if(scrap<0||scrap>production)return editMsg('A apara precisa ficar entre 0 e a produção total.',false);let a=read(AUTO_KEY,[]);if(!Array.isArray(a))a=[];const i=a.findIndex(r=>r&&r.status==='ok'&&(normId(r.id)===editingId||normId(r.opId)===editingId));if(i<0)return editMsg('Não encontrei essa OP em PRONTAS.',false);const net=Math.max(0,production-scrap),now=new Date().toISOString();a[i]={...a[i],status:'ok',production,scrap,net,updatedAt:now};if(!write(AUTO_KEY,a))return editMsg('Não foi possível salvar neste aparelho.',false);let list=read(OPS_KEY,[]);if(Array.isArray(list)){const j=list.findIndex(o=>normId(o?.id)===editingId);if(j>=0){list[j]={...list[j],autoProduction:production,autoScrap:scrap,autoNet:net,autoUpdatedAt:now};write(OPS_KEY,list)}}editMsg('✅ Valores atualizados. A OP continua em PRONTAS.',true);render();setTimeout(()=>{closeEdit();const ready=document.querySelector('#dfProdAuto [data-pa-pane="ok"]');if(ready)ready.click()},180)}
function decorateReady(){const root=$('dfPAOkList');if(!root)return;root.querySelectorAll('.dfPAList').forEach(card=>{const del=card.querySelector('[data-pa-del]');if(!del)return;const id=del.getAttribute('data-pa-del')||'';let edit=card.querySelector('[data-pa-edit]');if(!edit){edit=document.createElement('button');edit.type='button';edit.className='dfPAEditBtn';edit.setAttribute('data-pa-edit',id);edit.textContent='EDITAR';card.insertBefore(edit,del)}else edit.setAttribute('data-pa-edit',id)})}
function boot(){addStyle();ensureEditModal();document.addEventListener('click',e=>{const edit=e.target.closest&&e.target.closest('[data-pa-edit]');if(edit){e.preventDefault();e.stopPropagation();openEdit(edit.getAttribute('data-pa-edit'));return}if(e.target.closest&&e.target.closest('[data-pa-pane="now"]'))setTimeout(render,30)},false);window.addEventListener('storage',()=>{setTimeout(render,30);setTimeout(decorateReady,30)});const watch=$('dfProdAuto')||document.body;new MutationObserver(decorateReady).observe(watch,{childList:true,subtree:true});setInterval(()=>{render();decorateReady()},1000);setTimeout(()=>{render();decorateReady()},200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('pageshow',()=>setTimeout(()=>{render();decorateReady()},150),true);
})();
