(function(){
'use strict';
if(window.DFProducaoAgoraMaquinasV3)return;window.DFProducaoAgoraMaquinasV3=true;
const OPS_KEY='df_producao_ops_setores_test_v3';
const CAD_KEY='df_producao_cadastros_v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]||m));
const num=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
const fmt=v=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
function readOps(){try{const a=JSON.parse(localStorage.getItem(OPS_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function readCad(){try{return JSON.parse(localStorage.getItem(CAD_KEY)||'{}')||{}}catch(e){return{}}}
function calc(o){const production=(o?.rolls||[]).reduce((s,r)=>s+num(r?.peso),0),scrap=(o?.rolls||[]).reduce((s,r)=>s+num(r?.apara),0);return{production,scrap}}
function machines(){const d=readCad(),out=[];['Picote','Sacoleira','Blocadora'].forEach(sector=>{const a=Array.isArray(d?.[sector]?.machines)?d[sector].machines:[];a.forEach(name=>{name=String(name||'').trim();if(name&&!out.some(x=>x.name.toLowerCase()===name.toLowerCase()))out.push({name,sector})})});return out}
function currentOp(name){const key=String(name||'').trim().toLowerCase();return readOps().filter(o=>String(o?.machine||'').trim().toLowerCase()===key&&o?.status!=='closed').sort((a,b)=>String(b?.updatedAt||b?.createdAt||'').localeCompare(String(a?.updatedAt||a?.createdAt||'')))[0]||null}
function addCss(){if($('dfAgoraMachinesCssV3'))return;const s=document.createElement('style');s.id='dfAgoraMachinesCssV3';s.textContent=`
.dfAgoraTitle{font-size:22px;font-weight:950;margin:0 0 5px;color:#dbeafe}.dfAgoraSub{color:#94a3b8;font-size:12px;line-height:1.45;margin-bottom:12px}.dfAgoraList{display:flex;flex-direction:column;gap:11px}.dfAgoraMachine{border:2px solid #2563eb;background:linear-gradient(180deg,#112958,#0d2147);border-radius:17px;padding:14px 15px;box-shadow:inset 0 0 0 1px rgba(96,165,250,.10)}.dfAgoraMachine .name{font-size:17px;font-weight:950;color:#dbeafe}.dfAgoraNumbers{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px}.dfAgoraNum{border:1px solid #3b82f6;background:#0b1c3b;border-radius:11px;padding:10px}.dfAgoraNum span{display:block;color:#93c5fd;font-size:10px;font-weight:900}.dfAgoraNum b{display:block;color:#fff;font-size:18px;margin-top:4px}.dfAgoraEmpty{border:2px solid #2563eb;background:#10234a;border-radius:17px;padding:16px;color:#bfdbfe;font-size:12px}`;document.head.appendChild(s)}
function html(){const list=machines();if(!list.length)return '<div class="dfPogCard"><div class="dfAgoraTitle">🏭 PRODUÇÃO AGORA</div><div class="dfAgoraEmpty">Nenhuma máquina cadastrada ainda.</div></div>';
return `<div class="dfPogCard"><div class="dfAgoraTitle">🏭 PRODUÇÃO AGORA</div><div class="dfAgoraSub">Produção atual e apara de cada máquina.</div><div class="dfAgoraList">${list.map(m=>{const c=calc(currentOp(m.name));return `<div class="dfAgoraMachine"><div class="name">${esc(m.name)}</div><div class="dfAgoraNumbers"><div class="dfAgoraNum"><span>PRODUÇÃO ATUAL</span><b>${fmt(c.production)} kg</b></div><div class="dfAgoraNum"><span>APARA</span><b>${fmt(c.scrap)} kg</b></div></div></div>`}).join('')}</div></div>`}
function paint(){const host=$('dfPogPane');if(!host)return false;host.innerHTML=html();return true}
function intercept(){document.addEventListener('click',e=>{const b=e.target&&e.target.closest?e.target.closest('[data-pog="now"]'):null;if(!b)return;setTimeout(paint,0);setTimeout(paint,80)},true)}
function patchApi(){let tries=0,t=setInterval(()=>{tries++;const api=window.DFProducaoOpsGeradasV2;if(api&&typeof api.render==='function'){const old=api.render.bind(api);api.render=function(name){if(name==='now'){paint();return}return old(name)};clearInterval(t)}else if(tries>50)clearInterval(t)},100)}
function boot(){addCss();intercept();patchApi()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
