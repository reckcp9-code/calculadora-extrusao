(function(){
'use strict';
if(window.DFInlinePrintV1)return;window.DFInlinePrintV1=true;
const nativeOpen=window.open.bind(window);
window.open=function(url,target,features){
  if(url)return nativeOpen(url,target,features);
  let html='';
  const fake={
    document:{
      write:function(chunk){html+=String(chunk||'');},
      close:function(){render(html);}
    },
    focus:function(){},
    print:function(){}
  };
  return fake;
};
function render(html){
  let old=document.getElementById('dfOpInlineView');if(old)old.remove();
  const box=document.createElement('div');box.id='dfOpInlineView';
  box.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#fff;overflow:auto;-webkit-overflow-scrolling:touch;padding-top:max(52px,env(safe-area-inset-top));';
  const bar=document.createElement('div');bar.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2;height:max(48px,calc(48px + env(safe-area-inset-top)));padding-top:env(safe-area-inset-top);display:flex;align-items:center;gap:8px;background:#111827;padding-left:10px;padding-right:10px;';
  const back=document.createElement('button');back.type='button';back.textContent='‹ VOLTAR';back.style.cssText='border:1px solid #64748b;background:#111827;color:#fff;border-radius:999px;padding:9px 14px;font-weight:900;';back.onclick=function(){box.remove();};
  const pr=document.createElement('button');pr.type='button';pr.textContent='IMPRIMIR';pr.style.cssText='margin-left:auto;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:999px;padding:9px 14px;font-weight:900;';
  const frame=document.createElement('iframe');frame.title='Ordem de Produção';frame.style.cssText='display:block;width:100%;height:calc(100vh - 52px);border:0;background:#fff;';
  bar.append(back,pr);box.append(bar,frame);document.body.appendChild(box);
  let clean=String(html||'').replace(/setTimeout\(function\(\)\{window\.focus\(\);window\.print\(\)\},500\)/g,'setTimeout(function(){window.focus()},500)');
  frame.srcdoc=clean;
  pr.onclick=function(){try{frame.contentWindow.focus();frame.contentWindow.print();}catch(e){alert('Não foi possível abrir a impressão.')}};
}
})();