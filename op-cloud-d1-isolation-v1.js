(function(){
'use strict';
if(window.DFOpCloudD1IsolationV1)return;window.DFOpCloudD1IsolationV1=true;
const OPS='df_formula_ops_auto_v2';
const nativeSet=Storage.prototype.setItem;
const nativeDispatch=EventTarget.prototype.dispatchEvent;
function fromPhotoMerge(){try{return /\bmergeRemote\b/.test(String(new Error().stack||''))}catch(e){return false}}
Storage.prototype.setItem=function(key,value){
  if(this===localStorage&&key===OPS&&fromPhotoMerge())return;
  return nativeSet.call(this,key,value);
};
EventTarget.prototype.dispatchEvent=function(ev){
  if(fromPhotoMerge()){
    if(this&&this.id==='dfOpMonth'&&ev&&ev.type==='change')return true;
    if(this===window&&ev&&ev.type==='df-op-remote-merged')return true;
  }
  return nativeDispatch.call(this,ev);
};
})();
