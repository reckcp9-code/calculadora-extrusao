(function(){
  'use strict';

  const STORE='df_extrusao_medidas_auto_v1';
  const MAX=80;
  let saveTimer=0;
  let applying=false;
  let bound=false;

  function normText(s){
    return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  }

  function cleanNum(v){
    return String(v==null?'':v).trim().replace(/\s+/g,'').replace(',','.');
  }

  function displayNum(v){
    return String(v==null?'':v).replace('.',',');
  }

  function read(){
    try{
      const v=JSON.parse(localStorage.getItem(STORE)||'[]');
      return Array.isArray(v)?v:[];
    }catch(e){return []}
  }

  function write(list){
    try{localStorage.setItem(STORE,JSON.stringify(list.slice(0,MAX)))}catch(e){}
  }

  function findByLabel(root,terms,selector){
    if(!root)return null;
    const wanted=Array.isArray(terms)?terms:[terms];
    const labels=Array.from(root.querySelectorAll('label'));
    for(const label of labels){
      const t=normText(label.textContent);
      if(!wanted.some(x=>t.includes(normText(x))))continue;
      if(label.htmlFor){
        const byFor=document.getElementById(label.htmlFor);
        if(byFor&&(!selector||byFor.matches(selector)))return byFor;
      }
      const parent=label.parentElement;
      if(parent){
        const c=parent.querySelector(selector||'input,select');
        if(c)return c;
      }
      let n=label.nextElementSibling;
      while(n){
        if(!selector&&n.matches&&n.matches('input,select'))return n;
        if(selector&&n.matches&&n.matches(selector))return n;
        const q=n.querySelector&&n.querySelector(selector||'input,select');
        if(q)return q;
        n=n.nextElementSibling;
      }
    }
    return null;
  }

  function fields(){
    const pg=document.getElementById('pgEx');
    if(!pg)return null;
    const card=Array.from(pg.children).find(el=>el.classList&&el.classList.contains('card')) || pg.querySelector('.card');
    if(!card)return null;

    const width=document.getElementById('exL') || findByLabel(card,['largura do filme fechado','largura do filme'],'input');
    const length=findByLabel(card,['comprimento final / saco','comprimento final','comprimento do saco'],'input');
    const micra=document.getElementById('exM') || findByLabel(card,['micra desejada'],'input');
    const density=document.getElementById('exDs') || findByLabel(card,['densidade'],'select');
    const manual=document.getElementById('exDm') || findByLabel(card,['densidade manual'],'input');

    return width&&length&&micra&&density?{pg,card,width,length,micra,density,manual}:null;
  }

  function actualDensity(f){
    if(!f)return '';
    const d=cleanNum(f.density.value);
    if(d==='manual')return cleanNum(f.manual&&f.manual.value);
    return d;
  }

  function snapshot(f){
    return {
      w:cleanNum(f.width.value),
      l:cleanNum(f.length.value),
      m:cleanNum(f.micra.value),
      d:actualDensity(f),
      ts:Date.now()
    };
  }

  function valid(r){
    return !!(r&&r.w&&r.l&&r.m&&r.d&&Number.isFinite(Number(r.w))&&Number.isFinite(Number(r.l))&&Number.isFinite(Number(r.m))&&Number.isFinite(Number(r.d)));
  }

  function key(r){return [r.w,r.l,r.m,r.d].join('|')}

  function saveNow(){
    if(applying)return;
    const f=fields();if(!f)return;
    const r=snapshot(f);if(!valid(r))return;
    const list=read().filter(x=>key(x)!==key(r));
    list.unshift(r);
    write(list);
  }

  function scheduleSave(){
    if(applying)return;
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveNow,900);
  }

  function fire(el){
    if(!el)return;
    try{el.dispatchEvent(new Event('input',{bubbles:true}))}catch(e){}
    try{el.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
  }

  function setDensity(f,val){
    const target=cleanNum(val);
    let matched=false;
    Array.from(f.density.options||[]).forEach(o=>{
      if(cleanNum(o.value)===target){f.density.value=o.value;matched=true}
    });
    if(matched){
      fire(f.density);
      return;
    }
    const manualOpt=Array.from(f.density.options||[]).find(o=>cleanNum(o.value)==='manual');
    if(manualOpt){
      f.density.value=manualOpt.value;
      fire(f.density);
      setTimeout(()=>{
        const mf=document.getElementById('exDm')||f.manual||findByLabel(f.card,['densidade manual'],'input');
        if(mf){mf.value=displayNum(target);fire(mf)}
      },20);
    }
  }

  function applyRecipe(r){
    const f=fields();if(!f)return;
    applying=true;
    f.width.value=displayNum(r.w);
    f.length.value=displayNum(r.l);
    f.micra.value=displayNum(r.m);
    fire(f.width);fire(f.length);fire(f.micra);
    setDensity(f,r.d);
    hideSuggest();
    setTimeout(()=>{applying=false},250);
  }

  function addStyle(){
    if(document.getElementById('dfExAutoMeasureStyle'))return;
    const s=document.createElement('style');
    s.id='dfExAutoMeasureStyle';
    s.textContent=`
      .dfMeasureAnchor{position:relative!important}
      #dfMeasureSuggest{display:none;position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:120;background:#07111d;border:1px solid #36516c;border-radius:14px;overflow:hidden;box-shadow:0 18px 35px rgba(0,0,0,.45)}
      #dfMeasureSuggest.on{display:block}
      .dfMeasureItem{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:0;border-bottom:1px solid rgba(54,81,108,.55);background:#07111d;color:#f8fafc;padding:12px 13px;text-align:left;font:inherit}
      .dfMeasureItem:last-child{border-bottom:0}
      .dfMeasureItem:active{background:#102238}
      .dfMeasureMain{font-size:14px;font-weight:950;letter-spacing:.1px}
      .dfMeasureSub{display:block;margin-top:2px;color:#94a3b8;font-size:11px;font-weight:700}
      .dfMeasurePull{flex:0 0 auto;color:#ffd36a;font-size:11px;font-weight:950;white-space:nowrap}
      @media(max-width:560px){.dfMeasureItem{padding:13px 12px}.dfMeasureMain{font-size:15px}.dfMeasurePull{font-size:10px}}
    `;
    document.head.appendChild(s);
  }

  function ensureSuggest(f){
    addStyle();
    const host=f.width.parentElement||f.card;
    host.classList.add('dfMeasureAnchor');
    let box=document.getElementById('dfMeasureSuggest');
    if(!box){
      box=document.createElement('div');
      box.id='dfMeasureSuggest';
      box.setAttribute('role','listbox');
      host.appendChild(box);
    }else if(box.parentElement!==host){
      host.appendChild(box);
    }
    return box;
  }

  function hideSuggest(){
    const b=document.getElementById('dfMeasureSuggest');
    if(b){b.classList.remove('on');b.innerHTML=''}
  }

  function showSuggest(){
    const f=fields();if(!f)return;
    const q=cleanNum(f.width.value);
    if(!q){hideSuggest();return}
    const matches=read().filter(r=>String(r.w||'').startsWith(q)).slice(0,6);
    if(!matches.length){hideSuggest();return}
    const box=ensureSuggest(f);
    box.innerHTML='';
    matches.forEach(r=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='dfMeasureItem';
      b.innerHTML='<span><span class="dfMeasureMain">'+displayNum(r.w)+' × '+displayNum(r.l)+' × '+displayNum(r.m)+' µm</span><span class="dfMeasureSub">Densidade '+displayNum(r.d)+'</span></span><span class="dfMeasurePull">PUXAR TUDO</span>';
      b.addEventListener('pointerdown',e=>e.preventDefault());
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();applyRecipe(r)});
      box.appendChild(b);
    });
    box.classList.add('on');
  }

  function bind(){
    const f=fields();if(!f)return false;
    addStyle();ensureSuggest(f);

    [f.width,f.length,f.micra,f.density,f.manual].filter(Boolean).forEach(el=>{
      if(el.dataset.dfAutoMeasureBound)return;
      el.dataset.dfAutoMeasureBound='1';
      el.addEventListener('input',()=>{scheduleSave();if(el===f.width)showSuggest()});
      el.addEventListener('change',()=>{scheduleSave();if(el===f.width)showSuggest()});
    });

    if(!f.width.dataset.dfAutoMeasureFocus){
      f.width.dataset.dfAutoMeasureFocus='1';
      f.width.addEventListener('focus',showSuggest);
      f.width.addEventListener('blur',()=>setTimeout(hideSuggest,180));
    }

    if(!document.body.dataset.dfAutoMeasureOutside){
      document.body.dataset.dfAutoMeasureOutside='1';
      document.addEventListener('pointerdown',e=>{
        const box=document.getElementById('dfMeasureSuggest');
        const fw=fields();
        if(box&&box.classList.contains('on')&&fw&&e.target!==fw.width&&!box.contains(e.target))hideSuggest();
      },true);
    }

    bound=true;
    return true;
  }

  function init(){
    if(bind())return;
    let n=0;
    const iv=setInterval(()=>{n++;if(bind()||n>30)clearInterval(iv)},250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('df-ui-ready',()=>setTimeout(init,120));
  setTimeout(init,700);
})();
