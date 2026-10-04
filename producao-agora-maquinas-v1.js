(function(){
'use strict';
if(window.DF_PRODUCAO_AGORA_MAQUINAS_V1)return;window.DF_PRODUCAO_AGORA_MAQUINAS_V1=true;

const CAD_KEY='df_producao_cadastros_v1';
const AUTO_KEY='df_producao_ops_auto_v1';
const OPS_KEY='df_producao_ops_setores_test_v3';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const num=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
const fmt=v=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
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
function addStyle(){if($('dfAgoraMachinesCss'))return;const s=document.createElement('style');s.id='dfAgoraMachinesCss';s.textContent=`
#dfPAPaneNow>.dfPACard{padding:16px}#dfPAPaneNow>.dfPACard>h3{font-size:22px;margin:0 0 6px}.dfAgoraSub{color:#94a3b8;font-size:12px;margin-bottom:12px}.dfAgoraMachine{border:1px solid #334155;background:#0f172a;border-radius:17px;padding:15px;margin-top:10px}.dfAgoraMachineName{font-size:18px;font-weight:950;color:#f8fafc;margin-bottom:11px}.dfAgoraTotals{display:grid;grid-template-columns:1fr 1fr;gap:9px}.dfAgoraKpi{border:1px solid #263244;background:#111827;border-radius:14px;padding:13px}.dfAgoraKpi span{display:block;color:#94a3b8;font-size:10px;font-weight:800}.dfAgoraKpi b{display:block;color:#fff;font-size:21px;margin-top:5px}.dfAgoraEmpty{border:1px dashed #475569;border-radius:15px;padding:16px;color:#94a3b8;text-align:center;margin-top:10px}`;document.head.appendChild(s)}
function render(){
  const pane=$('dfPAPaneNow'),box=$('dfPANowList');if(!pane||!box||!pane.classList.contains('on'))return;
  addStyle();
  const title=pane.querySelector('.dfPACard>h3');if(title)title.textContent='Produção agora';
  const list=machines();
  if(!list.length){box.innerHTML='<div class="dfAgoraEmpty">Nenhuma máquina cadastrada.</div>';return}
  box.innerHTML='<div class="dfAgoraSub">Produção total e apara de hoje por máquina.</div>'+list.map(machine=>{const t=totalsFor(machine);return '<div class="dfAgoraMachine"><div class="dfAgoraMachineName">'+esc(machine)+'</div><div class="dfAgoraTotals"><div class="dfAgoraKpi"><span>PRODUÇÃO TOTAL</span><b>'+fmt(t.production)+' kg</b></div><div class="dfAgoraKpi"><span>APARA</span><b>'+fmt(t.scrap)+' kg</b></div></div></div>'}).join('');
}
function boot(){addStyle();document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-pa-pane="now"]'))setTimeout(render,30)},false);window.addEventListener('storage',()=>setTimeout(render,30));setInterval(render,1000);setTimeout(render,200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('pageshow',()=>setTimeout(render,150),true);
})();
