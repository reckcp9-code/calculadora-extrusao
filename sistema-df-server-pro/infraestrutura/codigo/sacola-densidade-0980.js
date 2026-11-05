(function(){
  'use strict';
  function applyHighDensity980(){
    var sel=document.getElementById('saDs');
    if(!sel)return false;
    var opts=Array.prototype.slice.call(sel.options||[]);
    var opt=opts.find(function(o){return /\bAlta\b/i.test(String(o.textContent||''));});
    if(!opt)return false;
    var wasSelected=(sel.selectedIndex===opt.index)||String(sel.value)==='0.952';
    if(String(opt.value)!=='0.980')opt.value='0.980';
    if(String(opt.textContent||'').trim()!=='0,980 — Alta')opt.textContent='0,980 — Alta';
    if(wasSelected&&String(sel.value)!=='0.980'){
      sel.value='0.980';
      try{sel.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
    }
    return true;
  }
  function boot(){
    applyHighDensity980();
    var tries=0;
    var timer=setInterval(function(){
      tries++;
      if(applyHighDensity980()&&tries>8)clearInterval(timer);
      if(tries>40)clearInterval(timer);
    },250);
    try{
      var obs=new MutationObserver(function(){applyHighDensity980();});
      obs.observe(document.documentElement,{childList:true,subtree:true});
      setTimeout(function(){try{obs.disconnect();}catch(e){}},30000);
    }catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('df-ui-ready',applyHighDensity980);
})();
