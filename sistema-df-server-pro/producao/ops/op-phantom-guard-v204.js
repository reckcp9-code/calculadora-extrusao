(function(){
  'use strict';
  if(window.DFOpPhantomGuardV204)return;
  window.DFOpPhantomGuardV204=true;

  const OPS_KEY='df_formula_ops_auto_v2';
  let cleaning=false,timer=0;

  function n(v){const x=Number(v);return Number.isFinite(x)?x:0}
  function technical(v){const s=String(v||'').toUpperCase().trim();return /^(?:DFMASTER(?:1|2|3)?[.-]|DFOPNAME\d*[.]|DFNAME\d*-|DFOPMETA\d*[.]|DFMETA-)/.test(s)}
  function isPhantom(o){
    if(!o||typeof o!=='object')return true;
    if(technical(o.id)||technical(o.qr)||technical(o.sourceId)||technical(o.source))return true;
    return String(o.source||'')==='foto-equipe' && !(n(o.produzido)>0);
  }
  function clean(emit){
    if(cleaning)return false;cleaning=true;
    try{
      const raw=localStorage.getItem(OPS_KEY)||'[]';let before=[];try{before=JSON.parse(raw)}catch(e){before=[]}if(!Array.isArray(before))before=[];
      const seen=new Set(),after=[];
      for(const o of before){if(isPhantom(o))continue;const id=String(o&&o.id||'').trim();if(id){if(seen.has(id))continue;seen.add(id)}after.push(o)}
      const next=JSON.stringify(after);if(next===raw)return false;
      localStorage.setItem(OPS_KEY,next);
      if(emit!==false){try{window.dispatchEvent(new CustomEvent('df-op-phantoms-cleaned',{detail:{removed:Math.max(0,before.length-after.length)}}))}catch(e){}const month=document.getElementById('dfOpMonth');if(month)try{month.dispatchEvent(new Event('change'))}catch(e){}}
      return true;
    }catch(e){return false}finally{cleaning=false}
  }
  function schedule(ms){clearTimeout(timer);timer=setTimeout(()=>clean(true),ms==null?80:ms)}

  clean(true);
  ['df-op-remote-merged','df-team-changed','df-product-server-applied','df-op-saved','df-op-save-ui-refresh'].forEach(ev=>window.addEventListener(ev,()=>schedule(80)));
  window.addEventListener('pageshow',()=>schedule(120));
  window.addEventListener('storage',e=>{if(e&&e.key===OPS_KEY)schedule(50)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(120)});
  window.DFOpPhantomGuard={clean};
})();
