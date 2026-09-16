(function(){
'use strict';
if(window.DFOpReportBackV209)return;window.DFOpReportBackV209=true;
var child=null,nativeOpen=null;
function prepare(e){
  var b=e.target&&e.target.closest?e.target.closest('#dfPrintReport'):null;
  if(!b)return;
  nativeOpen=window.open;
  window.open=function(){child=nativeOpen.apply(window,arguments);return child};
  setTimeout(function(){
    window.open=nativeOpen;
    if(!child)return;
    try{
      var add=function(){
        try{
          var d=child.document;if(!d||!d.body||d.getElementById('dfVoltarFormula209'))return;
          var bt=d.createElement('button');bt.id='dfVoltarFormula209';bt.type='button';bt.textContent='← VOLTAR PARA FORMULAÇÃO';
          bt.style.cssText='display:inline-flex;align-items:center;margin:0 0 14px;padding:10px 14px;border:1px solid #bbb;border-radius:9px;background:#fff;color:#111;font:700 14px Arial,sans-serif;cursor:pointer';
          bt.onclick=function(){try{if(child.opener&&!child.opener.closed)child.opener.focus()}catch(x){}try{child.close()}catch(x){try{child.history.back()}catch(y){}}};
          d.body.insertBefore(bt,d.body.firstChild);
          var st=d.createElement('style');st.textContent='@media print{#dfVoltarFormula209{display:none!important}}';d.head.appendChild(st);
        }catch(x){}
      };
      setTimeout(add,60);setTimeout(add,250);setTimeout(add,700);
    }catch(x){}
  },0);
}
document.addEventListener('click',prepare,true);
})();