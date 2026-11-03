(function(){
  'use strict';
  if(window.DFProductionNowKeepaliveV161)return;
  window.DFProductionNowKeepaliveV161=true;

  const TEAM_KEY='df_op_team_v1';
  let timer=0,observer=null,observed=null,lastOwnerState='';

  function moduleReady(){return !!(window.DFProductionNowTeamV159||window.DFProductionNowTeamV160)}
  function readTeam(){try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}}
  function saveTeam(t){try{localStorage.setItem(TEAM_KEY,JSON.stringify(t))}catch(e){}}
  function emitTeamChanged(team){try{window.dispatchEvent(new CustomEvent('df-team-changed',{detail:{team:team||null}}))}catch(e){}}

  function syncOwnerRole(){
    let live=null;
    try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function')live=window.DFOpCloud.team()}catch(e){}
    const saved=readTeam();
    let next=saved;

    if(live&&live.role){
      next=Object.assign({},saved||{},live);
    }else{
      const box=document.getElementById('dfOpTeamCloud');
      const txt=box?String(box.textContent||''):'';
      if(saved&&/\bDONO\b/i.test(txt))next=Object.assign({},saved,{role:'owner'});
      else if(saved&&/\bOPERADOR\b/i.test(txt))next=Object.assign({},saved,{role:'operator'});
    }

    if(next&&next.role){
      const before=String(saved&&saved.role||'').toLowerCase();
      const after=String(next.role||'').toLowerCase();
      const changed=!saved||JSON.stringify(saved)!==JSON.stringify(next);
      if(changed)saveTeam(next);
      const state=after+'|'+String(next.teamId||'');
      if(changed||state!==lastOwnerState){lastOwnerState=state;emitTeamChanged(next)}
      if(before!==after)askMount();
    }
  }

  function positionTab(){
    const tabs=document.querySelector('#dfFormulaOps .dfOpsTabs');
    const tab=document.getElementById('dfNowTab');
    if(!tabs||!tab||!tabs.contains(tab))return;
    const pending=tabs.querySelector('[data-pane="pending"]');
    if(pending&&pending.nextElementSibling!==tab)pending.insertAdjacentElement('afterend',tab);
  }

  function askMount(){
    if(!moduleReady())return;
    const ops=document.getElementById('dfFormulaOps');
    if(!ops)return;
    const hasTab=document.getElementById('dfNowTab');
    const hasPane=document.getElementById('dfPaneNow');
    if(hasTab&&hasPane){positionTab();return}
    clearTimeout(timer);
    timer=setTimeout(function(){
      try{window.dispatchEvent(new CustomEvent('df-ui-ready'))}catch(e){}
      setTimeout(positionTab,120);
    },90);
  }
  function attach(){
    syncOwnerRole();
    const ops=document.getElementById('dfFormulaOps');
    if(!ops){askMount();return}
    if(observed===ops&&observer){askMount();positionTab();return}
    if(observer)try{observer.disconnect()}catch(e){}
    observed=ops;
    observer=new MutationObserver(function(){syncOwnerRole();askMount();positionTab()});
    observer.observe(ops,{childList:true,subtree:true});
    askMount();positionTab();
  }
  function delayed(){setTimeout(function(){attach();syncOwnerRole();askMount();positionTab()},120);setTimeout(function(){attach();syncOwnerRole();askMount();positionTab()},500)}

  window.addEventListener('df-ui-ready',function(){setTimeout(attach,160)});
  window.addEventListener('df-team-changed',delayed);
  window.addEventListener('df-team-joined',delayed);
  window.addEventListener('pageshow',delayed);
  window.addEventListener('focus',delayed);
  document.addEventListener('click',function(e){
    const t=e.target&&e.target.closest?e.target.closest('#dfFormTabOps,#btFo,[data-pane="ops"],[data-pane="ok"],[data-pane="pending"],[data-pane="archive"],[data-pane="now"]'):null;
    if(t)delayed();
  },true);
  setInterval(function(){syncOwnerRole();attach();askMount();positionTab()},500);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',delayed,{once:true});else delayed();
})();
