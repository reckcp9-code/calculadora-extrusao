(function(){
  'use strict';
  if(window.DFProductionNowKeepaliveV160)return;
  window.DFProductionNowKeepaliveV160=true;

  let timer=0,observer=null,observed=null;

  function moduleReady(){return !!(window.DFProductionNowTeamV159||window.DFProductionNowTeamV160)}
  function askMount(){
    if(!moduleReady())return;
    const ops=document.getElementById('dfFormulaOps');
    if(!ops)return;
    if(document.getElementById('dfNowTab')&&document.getElementById('dfPaneNow'))return;
    clearTimeout(timer);
    timer=setTimeout(function(){
      try{window.dispatchEvent(new CustomEvent('df-ui-ready'))}catch(e){}
    },90);
  }
  function attach(){
    const ops=document.getElementById('dfFormulaOps');
    if(!ops){askMount();return}
    if(observed===ops&&observer){askMount();return}
    if(observer)try{observer.disconnect()}catch(e){}
    observed=ops;
    observer=new MutationObserver(function(){askMount()});
    observer.observe(ops,{childList:true,subtree:true});
    askMount();
  }
  function delayed(){setTimeout(function(){attach();askMount()},120);setTimeout(function(){attach();askMount()},500)}

  window.addEventListener('df-ui-ready',function(){setTimeout(attach,160)});
  window.addEventListener('df-team-changed',delayed);
  window.addEventListener('df-team-joined',delayed);
  window.addEventListener('pageshow',delayed);
  document.addEventListener('click',function(e){
    const t=e.target&&e.target.closest?e.target.closest('#dfFormTabOps,#btFo,[data-pane="ops"],[data-pane="ok"],[data-pane="pending"],[data-pane="archive"],[data-pane="now"]'):null;
    if(t)delayed();
  },true);
  setInterval(function(){attach();askMount()},2000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',delayed,{once:true});else delayed();
})();
