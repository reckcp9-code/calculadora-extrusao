(function(){
'use strict';
if(window.DFOpIntegritySweepV1)return;window.DFOpIntegritySweepV1=true;

const OPS_KEY='df_formula_ops_auto_v2';
const TOMBSTONE_KEY='df_deleted_ops_v1';
let running=false,timer=0,lastHash='';
const $=id=>document.getElementById(id);
const norm=v=>String(v||'').trim().toUpperCase();
const validQr=v=>/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim());
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function n(v){const x=Number(v);return Number.isFinite(x)?x:0}
function stamp(v){const x=Date.parse(String(v||''));return Number.isFinite(x)?x:0}
function localYmd(v){const d=v?new Date(v):new Date();if(Number.isNaN(d.getTime()))return'';const p=x=>String(x).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
function quickHash(v){let s='';try{s=JSON.stringify(v)}catch(e){s=String(v||'')}let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function completed(o){return !!(o&&validQr(o.qr||o.id)&&n(o.produzido)>0&&Number.isFinite(Number(o.apara))&&Number(o.apara)>=0&&(o.status==='ok'||o.manualConfirmed||o.source==='foto-equipe'||/^foto\+recuperacao-prontas/i.test(String(o.source||''))))}
function completionValue(o){return o?.manualConfirmedAt||o?.cloudSyncedAt||o?.updatedAt||o?.createdAt||''}
function completionStamp(o){return stamp(completionValue(o))}
function idOf(o){const a=norm(o?.id),q=norm(o?.qr);return validQr(a)?a:(validQr(q)?q:a||q)}
function score(o){let s=0;if(completed(o))s+=1000;if(o?.manualConfirmed)s+=300;if(o?.cloudPhotoId)s+=100;if(String(o?.produto||'').trim())s+=30;if(Array.isArray(o?.materials)&&o.materials.length)s+=20;return s}
function realText(v){const s=String(v??'').trim();return s&&s!=='—'?s:''}
function mergeWinner(a,b){
  const sa=score(a),sb=score(b),preferB=sb>sa||(sb===sa&&completionStamp(b)>completionStamp(a));
  const win=preferB?{...b}:{...a},other=preferB?a:b;
  const fields=['qr','numero','operador','maquina','produto','serverProductName','manualProductName','clienteFormulacao','cloudPhotoId','cloudTeamId','cloudSyncedAt'];
  for(const k of fields)if(!realText(win[k])&&realText(other?.[k]))win[k]=other[k];
  for(const k of ['largura','micra','gm','bobinas','expectedTotal'])if(!(n(win[k])>0)&&n(other?.[k])>0)win[k]=other[k];
  if((!Array.isArray(win.materials)||!win.materials.length)&&Array.isArray(other?.materials)&&other.materials.length)win.materials=other.materials;
  return win;
}
function cleanTechnical(o){const s=norm(o?.id||o?.qr||'');return /^(?:DFMASTER(?:1|2|3)?[.-]|DFOPNAME\d*[.]|DFNAME\d*-|DFOPMETA\d*[.]|DFMETA-|DFSTATUS-|DFOPSTATUS5-|DFOP-STATUS\d*-)/.test(s)}

function sweep(emit){
  if(running)return false;running=true;
  try{
    let ops=load(OPS_KEY,[]);if(!Array.isArray(ops))ops=[];
    const tombs=load(TOMBSTONE_KEY,{}),out=[],by=new Map();let tombChanged=false;
    for(const raw of ops){
      if(!raw||typeof raw!=='object'||cleanTechnical(raw))continue;
      let o={...raw},id=idOf(o),del=id&&tombs&&tombs[id];
      if(del){
        if(completed(o)&&completionStamp(o)>Number(del.at||0)+250){delete tombs[id];tombChanged=true}
        else continue;
      }
      if(completed(o)){
        if(o.status!=='ok')o.status='ok';
        if(Array.isArray(o.reasons)&&o.reasons.length)o.reasons=[];
        const d=localYmd(completionValue(o));if(d)o.data=d;
      }
      if(id&&validQr(id)){
        if(by.has(id)){const idx=by.get(id);out[idx]=mergeWinner(out[idx],o)}
        else{by.set(id,out.length);out.push(o)}
      }else out.push(o);
    }
    const before=quickHash(ops),after=quickHash(out),changed=before!==after;
    if(tombChanged)save(TOMBSTONE_KEY,tombs);
    if(changed)save(OPS_KEY,out);
    if((changed||tombChanged)&&emit!==false){
      const y=window.scrollY||window.pageYOffset||0,m=$('dfOpMonth');
      if(m)try{m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
      try{window.DFOpTeamDateCanonical?.run?.()}catch(e){}
      requestAnimationFrame(()=>requestAnimationFrame(()=>{try{window.scrollTo(0,y)}catch(e){}}));
      try{window.dispatchEvent(new CustomEvent('df-op-integrity-updated',{detail:{changed,tombChanged}}))}catch(e){}
    }
    lastHash=after;return changed||tombChanged;
  }catch(e){return false}finally{running=false}
}
function schedule(ms){clearTimeout(timer);timer=setTimeout(()=>sweep(true),ms==null?100:ms)}

['df-op-saved','df-op-save-ui-refresh','df-op-remote-merged','df-op-cloud-synced','df-op-record-deleted','df-op-revived','df-op-phantoms-cleaned'].forEach(ev=>window.addEventListener(ev,()=>schedule(80)));
window.addEventListener('df-ui-ready',()=>schedule(180));
window.addEventListener('pageshow',()=>schedule(180));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(220)});
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="ok"],[data-pane="month"],[data-pane="archive"]'))schedule(80)},true);

function boot(){setTimeout(()=>sweep(true),650)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DFOpIntegritySweep={run:()=>sweep(true)};
})();
