(function(){
'use strict';
if(window.DFOpProntasManualProductV2)return;
window.DFOpProntasManualProductV2=true;

var OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1',MANUAL='df_manual_op_product_v1';
var currentId='',openedWasReady=false;
function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function num(v){var s=String(v==null?'':v).trim().replace(/\s/g,'');if(!s)return 0;if(s.indexOf(',')>=0&&s.indexOf('.')>=0)s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');var n=parseFloat(s);return Number.isFinite(n)?n:0}
function validName(v){var s=String(v==null?'':v).trim();if(!s||/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s))return'';return s}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function findOp(id){var a=load(OPS,[]),n=norm(id);if(!Array.isArray(a))return null;return a.find(function(o){return ids(o).indexOf(n)>=0})||null}
function findRegName(id){var r=load(REG,{}),n=norm(id),name='';Object.keys(r||{}).some(function(k){var x=r[k]||{};if(norm(x.id||k)!==n)return false;var e=x.expected||{};name=validName(e.title)||validName(e.produto)||validName(e.product);return !!name});return name}
function fold(v){return String(v==null?'':v).normalize?String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase():String(v==null?'':v).toUpperCase()}
function cleanCandidate(v){
  var s=String(v==null?'':v).replace(/[|]/g,' ').replace(/\s+/g,' ').trim();
  s=s.replace(/\s+(?:UF|FASE|DATA(?:\s+EMISSAO)?|PREVISAO|PEDIDO|CLIENTE|FORMULACAO|LARGURA|ESPESSURA|GRAMATURA|PESO\s+LIQUIDO)\s*[:\-].*$/i,'').trim();
  s=s.replace(/^[\-:;,.\s]+|[\-:;,.\s]+$/g,'').trim();
  if(s.length>80)s=s.slice(0,80).trim();
  return validName(s);
}
function nameFromOcr(o){
  var text=String(o&&o.ocrText||'').trim();if(!text)return'';
  var lines=text.split(/\r?\n+/).map(function(x){return String(x||'').replace(/[|]/g,' ').replace(/\s+/g,' ').trim()}).filter(Boolean);
  for(var i=0;i<lines.length;i++){
    var raw=lines[i],f=fold(raw),m=null,c='';
    m=raw.match(/(?:CLIENTE\s*\/\s*FORMULA(?:Ç|C)[AÃA]O|CLIENTE\s*\/\s*FORMULACAO|NOME\s+DO\s+PRODUTO|PRODUTO)\s*[:\-]?\s*(.+)$/i);
    if(m&&m[1]){c=cleanCandidate(m[1]);if(c)return c}
    if(/CLIENTE\s*\/\s*FORMULACAO|NOME\s+DO\s+PRODUTO|^PRODUTO\b/.test(f)){
      for(var j=i+1;j<Math.min(lines.length,i+4);j++){
        var next=cleanCandidate(lines[j]);
        if(!next)continue;
        var nf=fold(next);
        if(/^(?:UF|FASE|DATA|PREVISAO|PEDIDO|LARGURA|ESPESSURA|GRAMATURA|PESO\s+LIQUIDO)\b/.test(nf))break;
        return next;
      }
    }
  }
  return'';
}
function currentNameInfo(id){
  var m=load(MANUAL,{}),o=findOp(id)||{},n=norm(id),v='';
  if((v=validName(m[n])))return{name:v,source:'salvo'};
  if((v=validName(o.serverProductName)))return{name:v,source:'servidor'};
  if((v=validName(o.manualProductName)))return{name:v,source:'salvo'};
  if((v=validName(o.clienteFormulacao)))return{name:v,source:'op'};
  if((v=validName(o.produto)))return{name:v,source:'op'};
  if((v=validName(o.product)))return{name:v,source:'op'};
  if((v=findRegName(id)))return{name:v,source:'op original'};
  if((v=nameFromOcr(o)))return{name:v,source:'foto'};
  return{name:'',source:''};
}
function currentName(id){return currentNameInfo(id).name}
function persistName(id,name){
  var n=norm(id),v=String(name||'').trim();if(!n||!v)return false;
  var a=load(OPS,[]),changed=false;
  if(Array.isArray(a))a.forEach(function(o){if(ids(o).indexOf(n)<0)return;o.manualProductName=v;o.clienteFormulacao=v;o.produto=v;o.product=v;o.nomeProduto=v;o.opNome=v;changed=true});
  if(changed)save(OPS,a);
  var r=load(REG,{}),key=null;
  Object.keys(r||{}).some(function(k){var x=r[k]||{};if(norm(x.id||k)===n){key=k;return true}return false});
  if(!key)key=id||n;
  var x=r[key]||{id:id||n,createdAt:new Date().toISOString(),expected:{}};if(!x.expected)x.expected={};
  x.expected.title=v;x.expected.produto=v;x.expected.product=v;r[key]=x;save(REG,r);
  var m=load(MANUAL,{});m[n]=v;save(MANUAL,m);
  return true;
}
function saveReadyWithoutRevalidating(id,name){
  var n=norm(id),a=load(OPS,[]);if(!Array.isArray(a))return false;
  var op=null;
  a.forEach(function(o){if(!op&&ids(o).indexOf(n)>=0)op=o});if(!op)return false;
  var operador=document.getElementById('fixOperador'),maquina=document.getElementById('fixMaquina'),prod=document.getElementById('fixProd'),apara=document.getElementById('fixApara');
  if(operador)op.operador=String(operador.value||'').trim();
  if(maquina)op.maquina=String(maquina.value||'').trim();
  if(prod)op.produzido=num(prod.value);
  if(apara)op.apara=num(apara.value);
  op.manualProductName=name;op.clienteFormulacao=name;op.produto=name;op.product=name;op.nomeProduto=name;op.opNome=name;
  op.status='ok';op.reasons=[];op.manualConfirmed=true;
  save(OPS,a);persistName(id,name);
  try{window.dispatchEvent(new CustomEvent('df-prontas-products-synced',{detail:{id:id,name:name,manual:true,keepReady:true}}))}catch(e){}
  try{window.dispatchEvent(new CustomEvent('df-op-meta-enriched',{detail:{id:id,name:name,manual:true,keepReady:true}}))}catch(e){}
  return true;
}
function repairV14Move(){
  var a=load(OPS,[]);if(!Array.isArray(a))return;var changed=false;
  a.forEach(function(o){
    if(!o||o.status!=='pending'||!o.manualConfirmed||!validName(o.manualProductName))return;
    var rs=Array.isArray(o.reasons)?o.reasons:[];
    if(!rs.length)return;
    var onlyRead=rs.every(function(r){return /^(?:operador|operador não foi lido|máquina|maquina|máquina não foi lida|maquina não foi lida)$/i.test(String(r||'').trim())});
    if(onlyRead){o.status='ok';o.reasons=[];changed=true}
  });
  if(changed){save(OPS,a);try{window.dispatchEvent(new CustomEvent('df-prontas-products-synced',{detail:{repair:true}}))}catch(e){}}
}
function mount(){
  if(!currentId)return false;
  var body=document.getElementById('dfModalBody'),saveBtn=document.getElementById('dfFixSave');if(!body||!saveBtn)return false;
  var old=document.getElementById('dfManualProductBox');if(old)old.remove();
  var info=currentNameInfo(currentId),name=info.name,box=document.createElement('div');box.id='dfManualProductBox';
  box.style.cssText='margin:12px 0;padding:12px;border:1px solid #f5a000;background:#211400;border-radius:12px';
  var hint=name&&info.source==='foto'?'✅ Nome sugerido automaticamente pela leitura da foto. Confira antes de salvar.':'Esta OP já está concluída. Salvar o nome do produto não altera o status: ela permanece em PRONTAS.';
  box.innerHTML='<label for="dfManualProductName" style="display:block;color:#ffd36a;font-size:13px;font-weight:900;margin:0 0 7px">NOME DO PRODUTO</label><input id="dfManualProductName" value="'+esc(name)+'" placeholder="Digite o nome do produto" autocomplete="off" style="width:100%;box-sizing:border-box;border:1px solid #f5a000;background:#0f172a;color:#fff;border-radius:10px;padding:13px;font-size:17px"><div id="dfManualProductHint" style="margin-top:7px;color:'+(info.source==='foto'?'#86efac':'#cbd5e1')+';font-size:11px;line-height:1.4">'+esc(hint)+'</div>';
  saveBtn.parentNode.insertBefore(box,saveBtn);
  saveBtn.textContent=openedWasReady?'✅ SALVAR NOME E MANTER EM PRONTAS':'✅ SALVAR CORREÇÃO E CONCLUIR';
  return true;
}
function closeModal(){var modal=document.getElementById('dfOpModal'),body=document.getElementById('dfModalBody');if(modal)modal.classList.remove('on');if(body)body.innerHTML='';currentId='';openedWasReady=false}
function refreshReady(){
  try{if(window.DFOpProntasProductSource&&typeof window.DFOpProntasProductSource.sync==='function')window.DFOpProntasProductSource.sync()}catch(e){}
  setTimeout(function(){var b=document.querySelector('[data-pane="ok"]');if(b&&b.classList.contains('on')){try{b.click()}catch(e){}}},80);
}

document.addEventListener('click',function(e){
  var open=e.target&&e.target.closest?e.target.closest('[data-view]'):null;
  if(open){currentId=String(open.getAttribute('data-view')||'').trim();var op=findOp(currentId);openedWasReady=!!(op&&op.status==='ok');setTimeout(mount,30);setTimeout(mount,180);return}
  var saveBtn=e.target&&e.target.closest?e.target.closest('#dfFixSave'):null;
  if(saveBtn&&currentId){
    var input=document.getElementById('dfManualProductName'),name=String(input&&input.value||'').trim();
    if(openedWasReady){
      e.preventDefault();e.stopImmediatePropagation();
      if(!name){alert('Digite o nome do produto.');return}
      if(saveReadyWithoutRevalidating(currentId,name)){closeModal();refreshReady()}
      return;
    }
    if(name)persistName(currentId,name);
  }
  var close=e.target&&e.target.closest?e.target.closest('#dfCloseModal'):null;if(close){currentId='';openedWasReady=false}
},true);

var obs=new MutationObserver(function(){var modal=document.getElementById('dfOpModal');if(currentId&&modal&&modal.classList.contains('on')&&!document.getElementById('dfManualProductName'))mount()});
function boot(){repairV14Move();obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});setTimeout(repairV14Move,800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
