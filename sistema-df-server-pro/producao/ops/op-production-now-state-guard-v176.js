(function(){
'use strict';
if(window.DFProductionNowStateGuardV176)return;
window.DFProductionNowStateGuardV176=true;

var STATUS_KEY='df_production_now_team_v1';
var PRODUCTS_KEY='df_now_products_test_v177';
var CLIENTS_KEY='df_now_clients_test_v175';
var nativeSetItem=Storage.prototype.setItem;
var applying=false,uiTimer=0,listObserver=null,rootObserver=null;

function parseJson(raw,fallback){try{var v=JSON.parse(String(raw||''));return v==null?fallback:v}catch(e){return fallback}}
function stamp(v){var n=Date.parse(String(v||''));return Number.isFinite(n)?n:0}
function mkey(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function latestMap(list){var out={};if(!Array.isArray(list))return out;list.forEach(function(x){if(!x||!x.machineKey)return;var k=String(x.machineKey),o=out[k];if(!o||stamp(x.updatedAt)>stamp(o.updatedAt))out[k]=x;else if(stamp(x.updatedAt)===stamp(o.updatedAt))out[k]=mergeSame(o,x)});return out}
function mergeSame(oldRec,newRec){
  var out=Object.assign({},oldRec||{},newRec||{});
  if(oldRec&&oldRec.productManual&&!newRec.productManual){out.product=oldRec.product;out.productManual=true}
  if(newRec&&newRec.productManual){out.product=newRec.product;out.productManual=true}
  if(oldRec&&oldRec.client&&!newRec.client)out.client=oldRec.client;
  if(oldRec&&String(oldRec.status||'').toUpperCase()==='FINALIZADA'&&String(newRec&&newRec.status||'').toUpperCase()!=='FINALIZADA')out.status='FINALIZADA';
  return out;
}
function mergeStatusRaw(incomingRaw){
  var incoming=parseJson(incomingRaw,null);if(!Array.isArray(incoming))return incomingRaw;
  var current=parseJson(localStorage.getItem(STATUS_KEY),[]);if(!Array.isArray(current))current=[];
  var map=latestMap(current);
  incoming.forEach(function(x){
    if(!x||!x.machineKey)return;
    var k=String(x.machineKey),old=map[k];
    if(!old){map[k]=x;return}
    var ot=stamp(old.updatedAt),nt=stamp(x.updatedAt);
    if(nt>ot)map[k]=x;
    else if(nt===ot)map[k]=mergeSame(old,x);
  });
  var out=Object.keys(map).map(function(k){return map[k]});
  out.sort(function(a,b){return stamp(b&&b.updatedAt)-stamp(a&&a.updatedAt)});
  return JSON.stringify(out);
}
function scheduleUi(){clearTimeout(uiTimer);uiTimer=setTimeout(applyManualUi,25)}

try{
  Storage.prototype.setItem=function(key,value){
    if(this===localStorage&&key===STATUS_KEY&&!applying){
      try{value=mergeStatusRaw(value)}catch(e){}
    }
    var r=nativeSetItem.call(this,key,value);
    if(this===localStorage&&(key===STATUS_KEY||key===PRODUCTS_KEY||key===CLIENTS_KEY))scheduleUi();
    return r;
  };
}catch(e){}

function load(key,fallback){try{var v=JSON.parse(localStorage.getItem(key)||'');return v==null?fallback:v}catch(e){return fallback}}
function active(){return latestMap(load(STATUS_KEY,[]))}
function manualProducts(){var x=load(PRODUCTS_KEY,{});return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}
function manualClients(){var x=load(CLIENTS_KEY,{});return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]})}

function applyManualUi(){
  var list=document.getElementById('dfNowList');if(!list)return;
  var by=active(),pm=manualProducts(),cm=manualClients();
  list.querySelectorAll('.dfNowCard').forEach(function(card){
    var machine=card.querySelector('.dfNowMachine'),productBox=card.querySelector('.dfNowProduct'),meta=card.querySelector('.dfNowMeta');
    if(!machine)return;
    var key=mkey(machine.textContent),rec=by[key]||{},manual=String(pm[key]||'').trim();
    if(!manual&&rec.productManual)manual=String(rec.product||'').trim();
    if(manual&&productBox){
      var current=String(productBox.firstChild&&productBox.firstChild.nodeType===1?productBox.firstChild.textContent:productBox.textContent||'').trim();
      if(current!==manual){
        var spec=productBox.querySelector&&productBox.querySelector('.dfNowSpecTestV174');
        var specText=spec?String(spec.textContent||'').trim():'';
        productBox.innerHTML='';var title=document.createElement('div');title.textContent=manual;productBox.appendChild(title);
        if(specText){var s=document.createElement('div');s.className='dfNowSpecTestV174';s.textContent=specText;productBox.appendChild(s)}
      }
    }
    var client=String(rec.client||cm[key]||'').trim();
    if(meta&&client){var line=meta.querySelector('.dfNowClientLineTestV175');if(!line){line=document.createElement('div');line.className='dfNowClientLineTestV175';meta.insertBefore(line,meta.firstChild)}line.innerHTML='Cliente: <b>'+esc(client)+'</b>'}
  });
}
function watchList(){
  var list=document.getElementById('dfNowList');if(!list)return false;
  if(listObserver)listObserver.disconnect();
  listObserver=new MutationObserver(function(){scheduleUi()});
  listObserver.observe(list,{childList:true,subtree:true,characterData:true});scheduleUi();return true;
}
function ensureWatch(){if(watchList())return;if(rootObserver)return;rootObserver=new MutationObserver(function(){if(watchList()){rootObserver.disconnect();rootObserver=null}});rootObserver.observe(document.documentElement,{childList:true,subtree:true})}

document.addEventListener('click',function(e){var t=e.target;if(!t)return;if(t.id==='dfNowTab'||t.id==='dfNowSave'||(t.closest&&t.closest('[data-now-edit],[data-now-done]'))){setTimeout(ensureWatch,20);setTimeout(scheduleUi,70);setTimeout(scheduleUi,260);setTimeout(scheduleUi,900)}},true);
window.addEventListener('df-ui-ready',function(){setTimeout(ensureWatch,100)});
window.addEventListener('pageshow',function(){setTimeout(ensureWatch,80)});
document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(function(){ensureWatch();scheduleUi()},80)});
setInterval(function(){if(!document.hidden){ensureWatch();scheduleUi()}},3000);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(ensureWatch,80)},{once:true});else setTimeout(ensureWatch,80);
})();
