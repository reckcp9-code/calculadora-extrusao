(function(){
'use strict';
if(window.DFFormulaSavedSearchV1)return;window.DFFormulaSavedSearchV1=true;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const FAVKEY='df_formula_favorites_v1';
function getFav(){try{return JSON.parse(localStorage.getItem(FAVKEY)||'[]')}catch(e){return[]}}
function setFav(a){try{localStorage.setItem(FAVKEY,JSON.stringify(a))}catch(e){}}
function isFav(v){return getFav().includes(String(v))}
function toggleFav(v){v=String(v);let a=getFav();a=a.includes(v)?a.filter(x=>x!==v):[v,...a];setFav(a)}
let active=null;
function isFormulaSelect(el){if(!el||el.tagName!=='SELECT')return false;const id=norm(el.id),name=norm(el.name),aria=norm(el.getAttribute('aria-label'));if(/formul/.test(id+' '+name+' '+aria))return true;const p=el.closest('.card,.savedItem,section,div');return !!(p&&/formula(c|ç)(a|ã)o|formula/.test(norm(p.textContent).slice(0,900))&&el.options&&el.options.length>2)}
function weight(o,i){const txt=String(o.textContent||''),v=String(o.value||'');const nums=(txt+' '+v).match(/\b1[6-9]\d{11}\b|\b20\d{11}\b|\b\d{13}\b/g);if(nums&&nums.length)return Number(nums[nums.length-1]);const d=(txt+' '+v).match(/20\d{2}[-\/]\d{1,2}[-\/]\d{1,2}(?:[ T]\d{1,2}:\d{2})?/);if(d){const t=Date.parse(d[0].replace(/\//g,'-'));if(Number.isFinite(t))return t}return -i}
function sortedOptions(sel){
  const selected=sel.value;
  const arr=[...sel.options].map((o,i)=>({text:o.textContent,value:o.value,disabled:o.disabled,weight:weight(o,i),i}));
  const sorted=arr.filter(x=>x.value).sort((a,b)=>(Number(isFav(b.value))-Number(isFav(a.value)))||b.weight-a.weight||a.i-b.i);
  const seenValue=new Set(),seenLabel=new Set(),data=[];
  for(const x of sorted){
    const valueKey=String(x.value);
    const labelKey=norm(x.text).replace(/\s+/g,' ');
    if(seenValue.has(valueKey)||seenLabel.has(labelKey))continue;
    seenValue.add(valueKey);
    seenLabel.add(labelKey);
    data.push(x);
  }
  return{selected,items:data}
}
function close(){if(active){active.remove();active=null}}
function open(sel){
  close();
  const data=sortedOptions(sel);
  const ov=document.createElement('div');
  active=ov;
  ov.className='df-formula-picker';
  ov.innerHTML='<div class="df-fp-box"><div class="df-fp-title">Formulações salvas <button type="button" class="df-fp-x">×</button></div><div class="df-fp-search"><span>⌕</span><input type="search" inputmode="search" autocomplete="off" placeholder="Pesquisar formulação..."></div><div class="df-fp-filter"><button type="button" data-filter="all" class="on">Todas</button><button type="button" data-filter="fav">★ Favoritas</button></div><div class="df-fp-list"></div></div>';
  document.body.appendChild(ov);
  const input=ov.querySelector('input'),list=ov.querySelector('.df-fp-list');
  let filter='all',touchY=0,moved=false,suppressUntil=0;

  function render(resetScroll){
    const previous=resetScroll?0:list.scrollTop;
    const q=norm(input.value);
    const items=data.items.filter(x=>(filter!=='fav'||isFav(x.value))&&(!q||norm(x.text).includes(q)));
    list.innerHTML='';
    if(!items.length){
      list.innerHTML='<div class="df-fp-empty">'+(filter==='fav'?'Nenhuma formulação favorita':'Nenhuma formulação encontrada')+'</div>';
      list.scrollTop=0;
      return;
    }
    items.forEach(x=>{
      const row=document.createElement('div');
      row.className='df-fp-row'+(x.value===data.selected?' on':'');
      const pick=document.createElement('button');
      pick.type='button';
      pick.className='df-fp-item';
      pick.innerHTML='<span class="df-fp-check">'+(x.value===data.selected?'✓':'')+'</span><span>'+String(x.text).replace(/\s*[—-]\s*/g,'<small> — </small>')+'</span>';
      pick.onclick=e=>{
        if(Date.now()<suppressUntil){e.preventDefault();e.stopPropagation();return}
        sel.value=x.value;
        sel.dispatchEvent(new Event('change',{bubbles:true}));
        close();
      };
      const star=document.createElement('button');
      star.type='button';
      star.className='df-fp-star'+(isFav(x.value)?' on':'');
      star.setAttribute('aria-label','Favoritar formulação');
      star.textContent=isFav(x.value)?'★':'☆';
      star.onclick=e=>{
        e.stopPropagation();
        if(Date.now()<suppressUntil)return;
        toggleFav(x.value);
        render(false);
      };
      row.append(pick,star);
      list.appendChild(row);
    });
    requestAnimationFrame(()=>{list.scrollTop=Math.min(previous,Math.max(0,list.scrollHeight-list.clientHeight))});
  }

  list.addEventListener('touchstart',e=>{
    touchY=e.touches&&e.touches[0]?e.touches[0].clientY:0;
    moved=false;
  },{passive:true});
  list.addEventListener('touchmove',e=>{
    const y=e.touches&&e.touches[0]?e.touches[0].clientY:touchY;
    if(Math.abs(y-touchY)>7)moved=true;
  },{passive:true});
  list.addEventListener('touchend',()=>{
    if(moved)suppressUntil=Date.now()+320;
    moved=false;
  },{passive:true});

  render(true);
  input.addEventListener('input',()=>render(true));
  ov.querySelectorAll('.df-fp-filter button').forEach(b=>b.onclick=()=>{
    filter=b.dataset.filter;
    ov.querySelectorAll('.df-fp-filter button').forEach(x=>x.classList.toggle('on',x===b));
    render(true);
  });
  ov.querySelector('.df-fp-x').onclick=close;
  ov.addEventListener('click',e=>{if(e.target===ov)close()});
  const coarse=window.matchMedia&&window.matchMedia('(pointer:coarse)').matches;
  if(!coarse)setTimeout(()=>input.focus(),60);
}
function bind(sel){if(sel.dataset.dfFormulaSearch==='1'||!isFormulaSelect(sel))return;sel.dataset.dfFormulaSearch='1';let lastOpen=0;const intercept=e=>{if(sel.disabled)return;const now=Date.now();if(e.cancelable)e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();if(now-lastOpen<450)return;lastOpen=now;try{sel.blur()}catch(_){}open(sel)};['touchstart','pointerdown','mousedown','click'].forEach(type=>sel.addEventListener(type,intercept,{capture:true,passive:false}));sel.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){intercept(e)}},{capture:true})}function scan(){document.querySelectorAll('select').forEach(bind)}
const st=document.createElement('style');st.textContent=`.df-formula-picker{position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,23,.62);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:18px}.df-fp-box{width:min(520px,100%);max-height:min(76vh,680px);display:flex;flex-direction:column;background:#101827;border:1px solid #334155;border-radius:24px;box-shadow:0 24px 80px rgba(0,0,0,.55);overflow:hidden}.df-fp-title{display:flex;justify-content:space-between;align-items:center;padding:18px 18px 10px;font-size:20px;font-weight:900}.df-fp-x{width:38px;height:38px;border:1px solid #334155;border-radius:12px;background:#172033;color:#cbd5e1;font-size:25px}.df-fp-search{display:flex;align-items:center;gap:9px;margin:4px 14px 9px;padding:0 13px;background:#0b1220;border:1px solid #475569;border-radius:14px}.df-fp-search input{border:0!important;outline:0!important;background:transparent!important;padding:13px 0!important;font-size:16px!important}.df-fp-filter{display:flex;gap:8px;padding:0 14px 10px}.df-fp-filter button{border:1px solid #334155;background:#111827;color:#94a3b8;border-radius:999px;padding:8px 13px;font-weight:800}.df-fp-filter button.on{border-color:#d99a20;color:#ffd36a;background:#211700}.df-fp-list{overflow-y:auto;overflow-x:hidden;padding:0 10px 14px;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;touch-action:pan-y;overflow-anchor:none;scroll-behavior:auto}.df-fp-row{display:grid;grid-template-columns:1fr 48px;align-items:center;border-bottom:1px solid #253149}.df-fp-row.on{background:#13223a;border-radius:12px}.df-fp-item{width:100%;display:grid;grid-template-columns:30px 1fr;gap:5px;text-align:left;align-items:center;border:0;background:transparent;color:#f8fafc;padding:15px 8px;font-size:17px;line-height:1.25}.df-fp-item small{color:#94a3b8;font-size:14px}.df-fp-check{font-size:20px;color:#86efac}.df-fp-star{border:0;background:transparent;color:#64748b;font-size:28px;padding:8px}.df-fp-star.on{color:#f5b82e}.df-fp-empty{padding:28px;text-align:center;color:#94a3b8}@media(max-width:560px){.df-formula-picker{align-items:flex-end;padding:0}.df-fp-box{width:100%;max-height:82vh;border-radius:24px 24px 0 0;padding-bottom:max(8px,env(safe-area-inset-bottom))}}`;document.head.appendChild(st);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('df-ui-ready',scan);
})();
(function(){
  if(window.DF_FORMULA_SAVE_FIRST_OP_V1)return;
  var s=document.createElement('script');
  s.src='./formula-save-first-op-v1.js?v=20261005-form-save-op-v253';
  s.async=false;
  document.head.appendChild(s);
})();
