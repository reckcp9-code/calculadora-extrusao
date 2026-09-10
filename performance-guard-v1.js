(function(){
  'use strict';
  if(window.__DF_PERF_GUARD_V1)return;
  window.__DF_PERF_GUARD_V1=true;

  const nativeInterval=window.setInterval.bind(window);
  const nativeTimeout=window.setTimeout.bind(window);
  const nativeAdd=EventTarget.prototype.addEventListener;
  const nativeRemove=EventTarget.prototype.removeEventListener;
  const listenerMap=new WeakMap();

  function sourceOf(fn){try{return typeof fn==='function'?Function.prototype.toString.call(fn):String(fn||'')}catch(e){return ''}}

  // O pacote antigo ainda contém um monitor de OCR/QR que varria o DOM a cada ~1,2 s.
  // O fluxo atual é manual, então esse monitor só consumia CPU no iPhone.
  window.setInterval=function(fn,delay){
    const src=sourceOf(fn),ms=Number(delay)||0,args=[].slice.call(arguments,2);
    if(ms>0&&ms<=1500&&/wrapTesseract|wrapQR\(\).*wrapTesseract|wrapQR;wrapTesseract/i.test(src)){
      return nativeInterval(function(){},24*60*60*1000);
    }
    return nativeInterval(function(){
      if(document.hidden&&ms<5000)return;
      try{return typeof fn==='function'?fn.apply(window,args):Function(String(fn))()}catch(e){setTimeout(function(){throw e},0)}
    },ms);
  };

  // Impede somente o reload automático antigo após SALVAR OP. A tela é atualizada sem recarregar tudo.
  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('#dfManualSave')){
      window.__DF_MANUAL_SAVING_UNTIL=Date.now()+10000;
    }
  },true);
  window.setTimeout=function(fn,delay){
    const src=sourceOf(fn),ms=Number(delay)||0,args=[].slice.call(arguments,2);
    if(Date.now()<Number(window.__DF_MANUAL_SAVING_UNTIL||0)&&ms>=850&&ms<=950&&/location\.reload\s*\(/.test(src)){
      return nativeTimeout(function(){
        try{window.dispatchEvent(new CustomEvent('df-op-save-ui-refresh'))}catch(e){}
      },ms);
    }
    return nativeTimeout(function(){return typeof fn==='function'?fn.apply(window,args):Function(String(fn))()},ms);
  };

  // Alguns reparadores antigos rodavam em todo clique, inclusive ao apenas focar um input.
  // Mantemos os reparadores para botões/navegação e pulamos o trabalho em campos de digitação.
  EventTarget.prototype.addEventListener=function(type,listener,options){
    if(this===document&&type==='click'&&typeof listener==='function'){
      const src=sourceOf(listener);
      if(/setTimeout\s*\(\s*(?:syncAll|merge|decorate)|addConfig\(\).*bindConfig\(\).*wrapSave\(\)/s.test(src)){
        const wrapped=function(ev){
          const t=ev&&ev.target;
          if(t&&t.closest&&t.closest('input,textarea,select,[contenteditable="true"]'))return;
          return listener.call(this,ev);
        };
        listenerMap.set(listener,wrapped);
        return nativeAdd.call(this,type,wrapped,options);
      }
    }
    return nativeAdd.call(this,type,listener,options);
  };
  EventTarget.prototype.removeEventListener=function(type,listener,options){
    return nativeRemove.call(this,type,listenerMap.get(listener)||listener,options);
  };

  // Bloqueia somente o MutationObserver do monitor OCR legado.
  if(window.MutationObserver){
    const NativeMO=window.MutationObserver;
    function GuardedMO(callback){
      const src=sourceOf(callback);
      if(/wrapTesseract|wrapQR\(\).*wrapTesseract/s.test(src)){
        return {observe:function(){},disconnect:function(){},takeRecords:function(){return[]}};
      }
      return new NativeMO(callback);
    }
    GuardedMO.prototype=NativeMO.prototype;
    window.MutationObserver=GuardedMO;
  }

  // Informa a sincronização de OP quando o backup geral acabou de salvar.
  try{
    const nativeSetItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      let old='';
      try{if(this===localStorage&&key==='df_cloud_last_backup_v1')old=String(this.getItem(key)||'')}catch(e){}
      const out=nativeSetItem.call(this,key,value);
      if(this===localStorage&&key==='df_cloud_last_backup_v1'&&old!==String(value||'')){
        try{window.dispatchEvent(new CustomEvent('df-general-backup-saved',{detail:{at:String(value||'')}}))}catch(e){}
      }
      return out;
    };
  }catch(e){}
})();