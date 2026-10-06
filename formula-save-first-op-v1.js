(function(){
'use strict';
if(window.DF_FORMULA_SAVE_FIRST_OP_V1)return;window.DF_FORMULA_SAVE_FIRST_OP_V1=true;
const KEY='df_formulacoes_v2';
const q=id=>document.getElementById(id);
const pn=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
const load=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){try{return Array.isArray(window.loadForms?.())?window.loadForms():[]}catch(_){return[]}}};
const time=f=>{const a=Date.parse(String(f?.updatedAt||f?.criado||''));if(Number.isFinite(a))return a;const id=Number(f?.id);return Number.isFinite(id)?id:0};
const newest=a=>a.slice().sort((x,y)=>time(y)-time(x)||Number(y?.id||0)-Number(x?.id||0));
function material(id){try{return window.materialById?window.materialById(id):null}catch(e){return null}}
function write(a){try{localStorage.setItem(KEY,JSON.stringify(newest(a)));return true}catch(e){return false}}
function selectNewest(id){
  const sel=q('foSavedSelect');if(!sel)return false;
  const forms=newest(load()),rank=new Map(forms.map((f,i)=>[String(f.id),i]));
  const opts=Array.from(sel.options||[]).sort((a,b)=>(rank.get(String(a.value))??999999)-(rank.get(String(b.value))??999999));
  opts.forEach(o=>sel.appendChild(o));
  if(id!=null&&Array.from(sel.options).some(o=>String(o.value)===String(id))){sel.value=String(id);sel.dispatchEvent(new Event('change',{bubbles:true}))}
  return true;
}
function refresh(id){
  try{if(typeof window.renderForms==='function')window.renderForms()}catch(e){}
  [0,40,140,350,800].forEach(ms=>setTimeout(()=>selectNewest(id),ms));
}
function popupNow(){
  let w=null;try{w=window.open('','_blank');if(w){w.document.open();w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OP</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font:700 18px system-ui;background:#fff;color:#111">Preparando OP...</body></html>');w.document.close()}}catch(e){}return w;
}
function closePopup(w){try{if(w&&!w.closed)w.close()}catch(e){}}
function fm(v,d=2){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'}
function standardPayload(f){
  const dados=f.op||{},largura=Number(dados.largura)||0,comprimento=Number(dados.comprimento)||0,micra=Number(dados.micra)||0,grama=Number(dados.grama)||0;
  const digitado=pn(q('dfMixBatchKg')?.value),mistura=digitado>0?digitado:(Number(window.dfMixBatchKgCurrent)||Number(f.total)||0);
  const letras=['A','B','C','D','E','F','G','H'];
  return{name:f.nome||'Formulação',date:new Date().toLocaleDateString('pt-BR'),size:largura&&comprimento&&micra?fm(largura,0)+' X '+fm(comprimento,0)+' X '+fm(micra/1000,3)+' mc':'_____',production:fm(Number(f.total)||0,0)+' KG',mix:fm(mistura,0)+' KG',doubleMicra:micra?fm(micra/100,2)+' mc':'_____',wallMicra:micra?fm(micra/200,2)+' mc':'_____',grams:grama?fm(grama,1)+' g/m':'_____',width:largura?fm(largura,1).replace(',0','')+' CM':'_____ CM',materials:(f.rows||[]).slice(0,8).map((r,i)=>{const m=r.id?(material(r.id)||r):r,pct=Number(r.pct)||0;return{code:letras[i],name:m.nome||r.nome||'',pct:pct?fm(pct,2)+'%':'',kg:pct?fm(mistura*pct/100,3)+' kg':''}})};
}
function printInPopup(f,w){
  const run=()=>{
    const pdf=window.DFOPLandscapePdf;
    if(!pdf||pdf.qr!==true||typeof pdf.create!=='function'||typeof window.QRCode!=='function')return false;
    try{
      const blob=new Blob([pdf.create(standardPayload(f))],{type:'application/pdf'}),url=URL.createObjectURL(blob);
      if(w&&!w.closed)w.location.replace(url);else if(typeof pdf.open==='function')pdf.open(standardPayload(f));
      setTimeout(()=>URL.revokeObjectURL(url),300000);
      return true;
    }catch(e){console.error('DF OP padrão:',e);return false}
  };
  if(run())return;
  let n=0,t=setInterval(()=>{if(run()||++n>80){clearInterval(t);if(n>80){closePopup(w);alert('A OP padrão ainda não terminou de carregar. Tente novamente.')}}},100);
}
async function saveAndOpen(){
  const nome=(q('foNome')?.value||'').trim()||'Formulação',total=pn(q('foTotal')?.value);
  const rows=(typeof window.getFoRows==='function'?window.getFoRows():[]).filter(r=>r?.id&&Number(r.pct)>0);
  if(!total){alert('Digite quantos kg quer fazer.');return}
  if(!rows.length){alert('Escolha pelo menos 1 material.');return}
  const pct=rows.reduce((s,r)=>s+(Number(r.pct)||0),0);
  if(Math.abs(100-pct)>0.05&&!confirm('A formulação não fechou 100%. Salvar mesmo assim?'))return;
  const pop=popupNow();
  let srv=null;
  try{
    if(typeof window.dfCalc==='function'){
      const calcRows=rows.map(r=>({pct:Number(r.pct)||0,precoKg:Number((material(r.id)||r).preco||r.preco)||0}));
      srv=await window.dfCalc('formulacao',{totalKg:total,rows:calcRows});
    }
  }catch(e){console.error('DF formula save:',e)}
  if(!srv){closePopup(pop);alert('Não foi possível calcular a formulação no servidor.');return}
  const now=Date.now(),rec={id:now,nome,total,rows,custo:Number(srv.custoTotal)||0,custoKg:Number(srv.custoKgFinal)||0,op:(typeof window.getExtrusaoOP==='function'?window.getExtrusaoOP():{}),criado:new Date(now).toISOString(),updatedAt:new Date(now).toISOString()};
  const a=load().filter(f=>String(f?.id)!==String(rec.id));a.unshift(rec);
  if(!write(a)){closePopup(pop);alert('Não foi possível salvar a formulação neste aparelho.');return}
  refresh(rec.id);
  printInPopup(rec,pop);
}
window.addEventListener('click',function(ev){
  const btn=ev.target&&ev.target.closest?ev.target.closest('#foSave'):null;if(!btn)return;
  ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
  saveAndOpen();
},true);
function normalizeUi(){selectNewest(q('foSavedSelect')?.value||null)}
function observe(){const b=q('foSaved');if(!b)return false;const o=new MutationObserver(()=>setTimeout(normalizeUi,0));o.observe(b,{childList:true,subtree:true});normalizeUi();return true}
function start(){let n=0,t=setInterval(()=>{if(observe()||++n>30)clearInterval(t)},150)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('df-ui-ready',()=>setTimeout(normalizeUi,500));
})();
