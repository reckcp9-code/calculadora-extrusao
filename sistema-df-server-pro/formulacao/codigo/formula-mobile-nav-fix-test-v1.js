(function(){
  'use strict';
  if(window.DFFormulaMobileNavFixTestV1)return;
  window.DFFormulaMobileNavFixTestV1=true;

  function style(){
    if(document.getElementById('dfFormulaMobileNavFixTestV1Style'))return;
    const s=document.createElement('style');
    s.id='dfFormulaMobileNavFixTestV1Style';
    s.textContent=`
      html,body{max-width:100%!important;overflow-x:hidden!important}
      #appContent,.w,#pgFo{max-width:100%!important;min-width:0!important;overflow-x:hidden!important}
      #pgFo > .dfAutoTopics{
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        box-sizing:border-box!important;
        overscroll-behavior-x:contain!important;
        scroll-behavior:auto!important;
      }
      .df-rf-modal{
        box-sizing:border-box!important;
        width:100%!important;
        height:100dvh!important;
        min-height:100dvh!important;
        padding-top:max(10px,env(safe-area-inset-top))!important;
        padding-right:max(10px,env(safe-area-inset-right))!important;
        padding-bottom:max(10px,env(safe-area-inset-bottom))!important;
        padding-left:max(10px,env(safe-area-inset-left))!important;
        align-items:center!important;
        overflow:hidden!important;
        overscroll-behavior:contain!important;
      }
      .df-rf-panel{
        box-sizing:border-box!important;
        max-height:calc(100dvh - max(20px,env(safe-area-inset-top)) - max(20px,env(safe-area-inset-bottom)))!important;
        height:auto!important;
        min-height:0!important;
        overflow:hidden!important;
      }
      .df-rf-head{flex:0 0 auto!important}
      .df-rf-tabs,.df-rf-search,.df-rf-note{flex:0 0 auto!important}
      .df-rf-list{
        min-height:0!important;
        flex:1 1 auto!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        -webkit-overflow-scrolling:touch!important;
        overscroll-behavior:contain!important;
        padding-bottom:max(18px,env(safe-area-inset-bottom))!important;
      }
      @supports not (height:100dvh){
        .df-rf-modal{height:100vh!important;min-height:100vh!important}
        .df-rf-panel{max-height:calc(100vh - 32px)!important}
      }
      @media(max-width:560px){
        #pgFo > .dfAutoTopics{
          display:flex!important;
          overflow-x:auto!important;
          overflow-y:hidden!important;
          -webkit-overflow-scrolling:touch!important;
          touch-action:pan-x!important;
          scrollbar-width:none!important;
          padding-left:0!important;
          padding-right:0!important;
        }
        #pgFo > .dfAutoTopics::-webkit-scrollbar{display:none!important}
        #pgFo > .dfAutoTopics .dfAutoTopic{
          flex:0 0 auto!important;
          max-width:calc(100vw - 42px)!important;
        }
        .df-rf-panel{width:100%!important;border-radius:18px!important}
        .df-rf-head{padding:13px 14px!important}
        .df-rf-head b{font-size:18px!important}
        .df-rf-tabs{padding:9px!important;gap:5px!important}
        .df-rf-tab{padding:9px 4px!important;font-size:11px!important}
        .df-rf-search{font-size:16px!important}
        .df-rf-note{font-size:10.5px!important;line-height:1.35!important}
      }
    `;
    document.head.appendChild(s);
  }

  function nav(){
    const p=document.getElementById('pgFo');
    return p&&p.querySelector(':scope > .dfAutoTopics');
  }

  function clampPageX(){
    if(Math.abs(window.scrollX||0)>1){
      const y=window.scrollY||0;
      window.scrollTo(0,y);
    }
  }

  function keepActiveInsideBar(btn,n){
    if(!btn||!n)return;
    const left=btn.offsetLeft;
    const right=left+btn.offsetWidth;
    const viewLeft=n.scrollLeft;
    const viewRight=viewLeft+n.clientWidth;
    if(left<viewLeft)n.scrollLeft=Math.max(0,left-8);
    else if(right>viewRight)n.scrollLeft=Math.max(0,right-n.clientWidth+8);
  }

  function bind(){
    style();
    const n=nav();
    if(!n||n.dataset.dfMobileNavFixed==='1')return !!n;
    n.dataset.dfMobileNavFixed='1';

    n.addEventListener('click',function(e){
      const btn=e.target&&e.target.closest?e.target.closest('.dfAutoTopic'):null;
      if(!btn)return;
      const y=window.scrollY||0;
      requestAnimationFrame(function(){
        keepActiveInsideBar(btn,n);
        window.scrollTo(0,y);
        try{btn.blur()}catch(_e){}
        requestAnimationFrame(function(){window.scrollTo(0,y)});
      });
    },false);

    n.addEventListener('focusin',function(){
      const y=window.scrollY||0;
      requestAnimationFrame(function(){window.scrollTo(0,y)});
    });

    window.addEventListener('scroll',clampPageX,{passive:true});
    return true;
  }

  function team(){
    try{
      const t=JSON.parse(localStorage.getItem('df_op_team_v1')||'null');
      return t&&t.teamId?t:null;
    }catch(e){return null}
  }

  function isTeamMember(){
    const t=team();
    if(!t)return false;
    const r=String(t.role||'').toLowerCase();
    return r==='owner'||r==='operator'||r==='member'||r==='admin';
  }

  function enforceReadyFormulaAccess(){
    const allowed=isTeamMember();
    const b=document.getElementById('dfReadyFormulaBtn');
    const w=document.getElementById('dfRF2wrap');
    const m=document.querySelector('.df-rf-modal');
    if(!allowed){
      if(b)b.remove();
      if(w&&!w.children.length)w.remove();
      if(m)m.remove();
    }
    return allowed;
  }

  function loadReadyFormulasForTeam(){
    style();
    if(!isTeamMember())return false;
    if(window.DFReadyFormulasV2||document.getElementById('dfReadyFormulasTeamLoader'))return true;
    const s=document.createElement('script');
    s.id='dfReadyFormulasTeamLoader';
    s.src='./teste/formulas-prontas-v2.js?v=20261001-team-mobile-fix-v1';
    s.defer=true;
    s.onload=function(){style();setTimeout(enforceReadyFormulaAccess,50)};
    document.head.appendChild(s);
    return true;
  }

  function start(){
    style();
    loadReadyFormulasForTeam();
    if(!bind()){
      let tries=0;
      const t=setInterval(function(){tries++;loadReadyFormulasForTeam();enforceReadyFormulaAccess();if(bind()||tries>50)clearInterval(t)},100);
    }
    let accessTries=0;
    const accessTimer=setInterval(function(){
      accessTries++;
      loadReadyFormulasForTeam();
      enforceReadyFormulaAccess();
      if(accessTries>40)clearInterval(accessTimer);
    },250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',function(){setTimeout(function(){bind();loadReadyFormulasForTeam();enforceReadyFormulaAccess()},50);setTimeout(function(){bind();loadReadyFormulasForTeam();enforceReadyFormulaAccess()},500)},{once:true});
  ['df-team-changed','df-team-joined','df-team-tab-permissions','pageshow','focus'].forEach(function(ev){window.addEventListener(ev,function(){setTimeout(function(){loadReadyFormulasForTeam();enforceReadyFormulaAccess()},80)})});
})();
