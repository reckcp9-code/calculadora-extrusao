(function(){
'use strict';
// Em Sacolas, digitar 0 no campo vazio inicia imediatamente um decimal: 0,320.
var ids=['saL','saC','saM','saDes','saDm','saQ','saPesoAlvo'];
function attach(el){
if(!el||el.dataset.dfLeadingZeroDecimal==='1')return;
el.dataset.dfLeadingZeroDecimal='1';
el.addEventListener('input',function(){
var value=String(el.value||'');
if(value==='0'){
el.value='0,';
try{el.setSelectionRange(2,2)}catch(e){}
el.dispatchEvent(new Event('change',{bubbles:true}));
}
});
}
function init(){ids.forEach(function(id){attach(document.getElementById(id))})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
setTimeout(init,450);
})();
