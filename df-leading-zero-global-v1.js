(function(){
'use strict';
if(window.DFLeadingZeroGlobalV1)return;window.DFLeadingZeroGlobalV1=true;
// Aplica 0, apenas em campos decimais editáveis; IDs, datas, códigos e quantidades inteiras ficam intactos.
function eligible(el){
if(!el||el.tagName!=='INPUT'||el.disabled||el.readOnly||el.dataset.dfNoAutoDecimal==='1')return false;
var type=(el.getAttribute('type')||'text').toLowerCase(),mode=(el.getAttribute('inputmode')||'').toLowerCase();
if(type==='number')return false; // input type=number não aceita vírgula como valor.
if(!['text','tel',''].includes(type))return false;
if(mode==='decimal')return true;
if(mode==='numeric')return false;
var context=[el.id,el.name,el.placeholder,el.getAttribute('aria-label'),el.closest('label')?.textContent,el.previousElementSibling?.textContent].join(' ').toLowerCase();
if(/(?:qr|c[oó]digo|id\b|senha|telefone|celular|whatsapp|cep|cpf|cnpj|n[uú]mero|quantas|unidades|rolos|pacotes|sacos|pe[cç]as|operador|m[aá]quina)/i.test(context))return false;
return /(?:peso|kg|gram|micra|espessura|largura|comprimento|densidade|desconto|percent|porcent|%|pre[cç]o|custo|valor|lucro|energia|aluguel|sal[aá]rio|produ[cç][aã]o|apara|deprecia|manuten[cç][aã]o|r\$)/i.test(context);
}
var busy=false;
document.addEventListener('input',function(e){
if(busy||e.isComposing||!e.isTrusted)return;
// Nunca recolocar a vírgula ao apagar: somente ao digitar o primeiro zero.
if(e.inputType!=='insertText'||e.data!=='0')return;
var el=e.target;if(!eligible(el)||el.value!=='0')return;
busy=true;
try{
var setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
setter.call(el,'0,');
try{el.setSelectionRange(2,2)}catch(_){}
el.dispatchEvent(new Event('input',{bubbles:true}));
}finally{busy=false}
},true);
})();
