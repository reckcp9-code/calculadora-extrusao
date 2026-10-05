(function(){
'use strict';
if(window.DF_PRODUCAO_MES_ATUAL_FILTRO_V1)return;window.DF_PRODUCAO_MES_ATUAL_FILTRO_V1=true;
const AUTO_KEY='df_producao_ops_auto_v1';
const OPS_KEY='df_producao_ops_setores_test_v3';
const CURRENT=(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')})();
const norm=v=>String(v||'').trim().toUpperCase().replace(/\s+/g,'');
function read(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function monthFromId(v){const m=String(v||'').toUpperCase().match(/DFOP-(\d{4})(\d{2})\d{2}-/);return m?m[1]+'-'+m[2]:''}
function recordMonth(r){
  if(!r)return'';
  const byId=monthFromId(r.opId||r.id);if(byId)return byId;
  const opId=norm(r.opId||r.id),op=(read(OPS_KEY,[])||[]).find(x=>norm(x&&x.id)===opId);
  const byOp=monthFromId(op&&op.id);if(byOp)return byOp;
  for(const v of [r.date,r.createdAt,op&&op.start,op&&op.createdAt]){const s=String(v||'');if(/^\d{4}-\d{2}/.test(s))return s.slice(0,7)}
  return'';
}
function currentIds(){const set=new Set();for(const r of read(AUTO_KEY,[])||[]){if(!r)continue;if(recordMonth(r)===CURRENT)set.add(norm(r.opId||r.id))}return set}
function idsInText(t){return [...new Set((String(t||'').toUpperCase().match(/DFOP-\d{8}-[A-Z0-9-]+/g)||[]).map(norm))]}
function hideCardForId(el,root,id){
  let node=el,chosen=el;
  while(node&&node!==root){
    const ids=idsInText(node.textContent||'');
    if(ids.length>1)break;
    if(ids.length===1&&ids[0]===id)chosen=node;
    node=node.parentElement;
  }
  if(chosen&&chosen!==root)chosen.style.setProperty('display','none','important');
}
function filterPane(root){
  if(!root)return;
  const keep=currentIds();
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const hits=[];let n;
  while((n=walker.nextNode())){const ids=idsInText(n.nodeValue||'');for(const id of ids)hits.push([n.parentElement,id])}
  for(const [el,id] of hits){if(!keep.has(id))hideCardForId(el,root,id)}
  root.querySelectorAll('.dfPAList').forEach(card=>{const ids=idsInText(card.textContent||'');if(ids.length&&ids.every(id=>!keep.has(id)))card.style.setProperty('display','none','important')});
}
function apply(){filterPane(document.getElementById('dfPAPaneOk'));filterPane(document.getElementById('dfPAPaneArchive'))}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(apply,40)}
function boot(){apply();const root=document.getElementById('dfProdAuto')||document.documentElement;new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true});document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('[data-pa-pane="ok"],[data-pa-pane="archive"]'))setTimeout(apply,60)},true);window.addEventListener('df-producao-team-synced',()=>setTimeout(apply,80));window.addEventListener('pageshow',()=>setTimeout(apply,80));setInterval(apply,4000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
