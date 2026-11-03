(function(){
'use strict';
if(window.DFOpGeneratedMetaSyncV177)return;window.DFOpGeneratedMetaSyncV177=true;

var REG='df_op_qr_registry_v1',OPS='df_formula_ops_auto_v2',STATUS='df_production_now_team_v1';
var syncing=false,lastSync=0,retryClick=false;
function $(id){return document.getElementById(id)}
function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'')}
function valid(v){return /^DFOP-[A-Z0-9-]{8,}$/i.test(String(v||'').trim())}
function regEntry(code){var r=load(REG,{}),c=norm(code),out=null;Object.keys(r||{}).some(function(k){var x=r[k]||{},id=String(x.id||k||'');if(norm(id)===c){out=x;return true}return false});return out}
function hasName(x){return !!String(x&&x.expected&&x.expected.title||'').trim()}
function nonempty(v){return !(v==null||v===''||v===0||(Array.isArray(v)&&!v.length))}
function fillMissing(target,key,value){if(!target||!nonempty(value))return false;var cur=target[key];if(nonempty(cur)&&!(/^sem produto$/i.test(String(cur))))return false;target[key]=value;return true}
function enrichOp(x,e,id){if(!x||!e)return false;var changed=false,title=String(e.title||'').trim();
  changed=fillMissing(x,'produto',title)||changed;
  changed=fillMissing(x,'product',title)||changed;
  changed=fillMissing(x,'opNome',title)||changed;
  changed=fillMissing(x,'largura',+e.largura||0)||changed;
  changed=fillMissing(x,'micra',e.micra||0)||changed;
  changed=fillMissing(x,'gm',+e.gm||0)||changed;
  changed=fillMissing(x,'medida',String(e.medida||''))||changed;
  changed=fillMissing(x,'comprimento',e.comprimento||'')||changed;
  changed=fillMissing(x,'expectedTotal',+e.totalKg||0)||changed;
  if((!Array.isArray(x.materials)||!x.materials.length)&&Array.isArray(e.materials)&&e.materials.length){x.materials=e.materials;changed=true}
  if(!x.qr&&id){x.qr=id;changed=true}
  return changed;
}
function mirrorOps(){var r=load(REG,{}),a=load(OPS,[]);if(!Array.isArray(a))return false;var changed=false;
  for(var i=0;i<a.length;i++){var x=a[i];if(!x)continue;var code=norm(x.id||x.qr||'');if(!code)continue;var re=null;Object.keys(r||{}).some(function(k){var z=r[k]||{},id=String(z.id||k||'');if(norm(id)===code){re=z;return true}return false});if(re&&enrichOp(x,re.expected||{},String(re.id||code)))changed=true}
  if(changed){save(OPS,a);try{window.dispatchEvent(new CustomEvent('df-op-meta-enriched'))}catch(e){}}
  return changed;
}
function mirrorStatus(){var a=load(STATUS,[]);if(!Array.isArray(a))return false;var changed=false;
  a.forEach(function(x){if(!x||!x.op)return;var re=regEntry(x.op),e=re&&re.expected||{},title=String(e.title||'').trim();if(title&&(!String(x.product||'').trim()||/^sem produto$/i.test(String(x.product||'')))){x.product=title;changed=true}if(e.medida&&!x.spec){x.spec=String(e.medida)+(e.micra?' • micra '+String(e.micra).replace('.',','):'');changed=true}});
  if(changed){save(STATUS,a);try{window.dispatchEvent(new CustomEvent('df-now-meta-enriched'))}catch(e){}}
  return changed;
}
function refreshSelected(){var sel=$('dfNowSelectedOp');if(!sel||!sel.value)return;var re=regEntry(sel.value),e=re&&re.expected||{},title=String(e.title||'').trim();if(!title)return;var info=$('dfNowSelectedInfo');if(info){var txt=String(info.textContent||'');if(txt.indexOf(title)<0)info.innerHTML='✅ <b>OP:</b> '+String(re.id||sel.value).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})+'<br><b>Produto:</b> '+title.replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})+'<br><span style="color:#86efac">Dados recebidos do celular que gerou a OP.</span>'}
  var pi=$('dfNowProductManual');if(pi&&!String(pi.value||'').trim())pi.value=title;
}
function refreshView(){mirrorOps();var changed=mirrorStatus();refreshSelected();if(changed){var tab=$('dfNowTab'),pane=$('dfPaneNow');if(tab&&pane&&pane.classList.contains('on'))setTimeout(function(){try{tab.click()}catch(e){}},20)}}
function registryApi(){return window.DFOpRegistryCloudTestV174||null}
async function sync(force){var now=Date.now();if(syncing)return false;if(!force&&now-lastSync<2500){refreshView();return true}var api=registryApi();if(!api||typeof api.sync!=='function'){refreshView();return false}syncing=true;lastSync=now;try{await api.sync();refreshView();return true}catch(e){refreshView();return false}finally{syncing=false}}
function publishSoon(){var tries=0,t=setInterval(function(){tries++;var api=registryApi();if(api&&typeof api.publishAll==='function'){clearInterval(t);setTimeout(function(){api.publishAll().then(function(){setTimeout(function(){sync(true)},500)}).catch(function(){})},120)}else if(tries>20)clearInterval(t)},100)}
function waitAndRetryFind(btn){if(retryClick)return;retryClick=true;var info=$('dfNowSelectedInfo');if(info)info.innerHTML='☁️ Buscando o nome e os dados desta OP no celular da equipe...';Promise.race([sync(true),new Promise(function(res){setTimeout(res,1700)})]).then(function(){refreshView()}).finally(function(){setTimeout(function(){retryClick=false;if(btn&&document.body.contains(btn)){btn.dataset.dfMetaRetry='1';btn.click()}},30)})}
function bind(){document.addEventListener('click',function(ev){var t=ev.target;if(!t)return;
  if(t.id==='dfNowFindCode'){
    if(t.dataset.dfMetaRetry==='1'){delete t.dataset.dfMetaRetry;return}
    var code=String($('dfNowCode')&&$('dfNowCode').value||'').trim(),re=regEntry(code);if(valid(code)&&!hasName(re)){ev.preventDefault();ev.stopImmediatePropagation();waitAndRetryFind(t);return}
  }
  if(t.id==='dfNowReadOp'||t.id==='dfNowTab'||t.id==='dfCloudRefresh')setTimeout(function(){sync(true)},80);
},true)}
function boot(){bind();setTimeout(function(){refreshView();sync(true)},650);setTimeout(refreshView,1600);
  window.addEventListener('df-op-qr-created',function(ev){var d=ev&&ev.detail||{};if(d.source==='cloud-team'){setTimeout(refreshView,50);return}publishSoon();setTimeout(refreshView,80)});
  window.addEventListener('df-op-remote-merged',function(){setTimeout(function(){sync(true)},80)});
  window.addEventListener('df-team-joined',function(){publishSoon();setTimeout(function(){sync(true)},250)});
  window.addEventListener('df-team-changed',function(){publishSoon();setTimeout(function(){sync(true)},250)});
  window.addEventListener('online',function(){publishSoon();setTimeout(function(){sync(true)},200)});
  window.addEventListener('pageshow',function(){setTimeout(function(){sync(true)},180)});
  window.addEventListener('storage',function(e){if(e&&e.key===REG)setTimeout(refreshView,30)});
  setInterval(function(){if(!document.hidden)sync(false)},12000);
}
window.DFOpGeneratedMetaSyncV177Api={sync:function(){return sync(true)},refresh:refreshView,publish:publishSoon};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();