(function(){
  'use strict';
  if(window.DFOpPhantomGuardV204)return;
  window.DFOpPhantomGuardV204=true;

  const OPS_KEY='df_formula_ops_auto_v2';
  let cleaning=false,last='';

  function read(){try{const v=JSON.parse(localStorage.getItem(OPS_KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
  function n(v){const x=Number(v);return Number.isFinite(x)?x:0}
  function isPhantom(o){
    if(!o||typeof o!=='object')return true;
    // Registros criados automaticamente apenas porque uma FOTO da equipe foi
    // sincronizada não são OP concluída. Uma OP remota só entra no fechamento
    // quando trouxe produção real (>0). OPs normais do app não são tocadas.
    return String(o.source||'')==='foto-equipe' && !(n(o.produzido)>0);
  }
  function dedupe(a){
    const seen=new Set(),out=[];
    for(const o of a){
      if(isPhantom(o))continue;
      const id=String(o&&o.id||'').trim();
      if(id){if(seen.has(id))continue;seen.add(id)}
      out.push(o);
    }
    return out;
  }
  function clean(emit){
    if(cleaning)return false;
    cleaning=true;
    try{
      const before=read(),after=dedupe(before);
      const sig=JSON.stringify(after);
      if(after.length!==before.length||sig!==JSON.stringify(before)){
        localStorage.setItem(OPS_KEY,sig);
        last=sig;
        if(emit!==false){
          try{window.dispatchEvent(new CustomEvent('df-op-phantoms-cleaned',{detail:{removed:before.length-after.length}}))}catch(e){}
          const month=document.getElementById('dfOpMonth');
          if(month)month.dispatchEvent(new Event('change'));
        }
        return true;
      }
      last=sig;
      return false;
    }catch(e){return false}finally{cleaning=false}
  }

  // Limpa o estoque antigo imediatamente.
  clean(true);

  // Toda sincronização de fotos pode tentar recriar um registro foto-equipe.
  // Limpamos logo após o merge e também quando a tela volta ao primeiro plano.
  window.addEventListener('df-op-remote-merged',()=>setTimeout(()=>clean(true),0));
  window.addEventListener('df-team-changed',()=>setTimeout(()=>clean(true),50));
  window.addEventListener('focus',()=>clean(true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)clean(true)});

  // Guarda leve para versões antigas/PWA que sincronizam sem emitir evento.
  setInterval(()=>{
    try{const raw=localStorage.getItem(OPS_KEY)||'[]';if(raw!==last)clean(true)}catch(e){}
  },2500);

  window.DFOpPhantomGuard={clean};
})();
