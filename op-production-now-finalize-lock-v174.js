(function(){
  'use strict';
  if(window.DFProductionFinalizeLockV174)return;
  window.DFProductionFinalizeLockV174=true;

  var STATUS_KEY='df_production_now_team_v1';
  var LOCK_KEY='df_production_now_finish_locks_v174';
  var nativeSetItem=Storage.prototype.setItem;
  var internalWrite=false;

  function now(){return new Date().toISOString()}
  function time(v){var n=Date.parse(String(v||''));return Number.isFinite(n)?n:0}
  function readJson(key,fallback){try{var raw=localStorage.getItem(key);if(!raw)return fallback;var v=JSON.parse(raw);return v==null?fallback:v}catch(e){return fallback}}
  function readLocks(){var x=readJson(LOCK_KEY,{});return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}
  function writeLocks(x){try{internalWrite=true;nativeSetItem.call(localStorage,LOCK_KEY,JSON.stringify(x||{}))}catch(e){}finally{internalWrite=false}}
  function readStatuses(){var a=readJson(STATUS_KEY,[]);return Array.isArray(a)?a:[]}

  function latestForKey(a,key){
    var best=null;
    (a||[]).forEach(function(x){if(!x||x.machineKey!==key)return;if(!best||time(x.updatedAt)>time(best.updatedAt))best=x});
    return best;
  }

  function protectRaw(raw){
    var a;try{a=JSON.parse(String(raw||'[]'))}catch(e){return raw}
    if(!Array.isArray(a))return raw;
    var locks=readLocks(),locksChanged=false,arrChanged=false;

    a.forEach(function(x){
      if(!x||!x.machineKey)return;
      if(String(x.status||'').toUpperCase()!=='FINALIZADA')return;
      var ts=x.updatedAt||x.finalizedAt||now(),old=locks[x.machineKey];
      if(!old||time(ts)>=time(old.updatedAt)){
        locks[x.machineKey]={updatedAt:ts,rec:Object.assign({},x,{status:'FINALIZADA',updatedAt:ts,finalizedAt:x.finalizedAt||ts})};
        locksChanged=true;
      }
    });

    Object.keys(locks).forEach(function(key){
      var lock=locks[key];
      if(!lock||!lock.rec){delete locks[key];locksChanged=true;return}
      var lt=time(lock.updatedAt),idx=-1,best=null;
      for(var i=0;i<a.length;i++){
        if(a[i]&&a[i].machineKey===key){
          if(!best||time(a[i].updatedAt)>time(best.updatedAt)){best=a[i];idx=i}
        }
      }
      if(!best){a.unshift(lock.rec);arrChanged=true;return}
      var rt=time(best.updatedAt),rs=String(best.status||'').toUpperCase();
      if(rs==='FINALIZADA'){
        if(rt>=lt){
          var nts=best.updatedAt||lock.updatedAt;
          locks[key]={updatedAt:nts,rec:Object.assign({},lock.rec,best,{status:'FINALIZADA',updatedAt:nts,finalizedAt:best.finalizedAt||lock.rec.finalizedAt||nts})};
          locksChanged=true;
        }else{
          a[idx]=lock.rec;arrChanged=true;
        }
        return;
      }
      if(rt>lt){
        delete locks[key];locksChanged=true;
      }else{
        a[idx]=lock.rec;arrChanged=true;
      }
    });

    if(locksChanged)writeLocks(locks);
    return arrChanged?JSON.stringify(a):raw;
  }

  try{
    Storage.prototype.setItem=function(key,value){
      if(!internalWrite&&this===localStorage&&key===STATUS_KEY){
        try{value=protectRaw(value)}catch(e){}
      }
      return nativeSetItem.call(this,key,value);
    };
  }catch(e){}

  function lockFinish(key){
    if(!key)return;
    var a=readStatuses(),x=latestForKey(a,key);if(!x)return;
    var ts=now(),rec=Object.assign({},x,{status:'FINALIZADA',updatedAt:ts,finalizedAt:ts}),locks=readLocks();
    locks[key]={updatedAt:ts,rec:rec};writeLocks(locks);
    var out=a.filter(function(v){return !v||v.machineKey!==key});out.unshift(rec);
    try{localStorage.setItem(STATUS_KEY,JSON.stringify(out))}catch(e){}
  }

  function enforce(){
    var locks=readLocks();if(!Object.keys(locks).length)return;
    try{var raw=localStorage.getItem(STATUS_KEY);if(raw!=null)localStorage.setItem(STATUS_KEY,raw)}catch(e){}
  }

  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-now-done]'):null;
    if(!b)return;
    lockFinish(String(b.getAttribute('data-now-done')||''));
    setTimeout(enforce,150);setTimeout(enforce,800);setTimeout(enforce,1800);
  },true);

  window.addEventListener('pageshow',function(){setTimeout(enforce,100)});
  window.addEventListener('online',function(){setTimeout(enforce,250)});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(enforce,120)});
  setInterval(enforce,5000);
  setTimeout(enforce,50);
})();
