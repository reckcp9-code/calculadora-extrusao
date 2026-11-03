(function(){
  'use strict';
  if(window.DFFormulaMobileNavFixTestV2)return;
  window.DFFormulaMobileNavFixTestV2=true;

  let currentNav=null;
  let navObserver=null;
  let pageObserver=null;

  function addStyle(){
    if(document.getElementById('dfFormulaMobileNavFixTestV2Style'))return;
    const s=document.createElement('style');
    s.id='dfFormulaMobileNavFixTestV2Style';
    s.textContent=`
      html,body{max-width:100%!important;overflow-x:hidden!important}
      #appContent,.w,#pgFo{max-width:100%!important;min-width:0!important;overflow-x:hidden!important}
      #pgFo > .dfAutoTopics{
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        box-sizing:border-box!important;
        display:flex!important;
        overflow-x:auto!important;
        overflow-y:hidden!important;
        overscroll-behavior-x:contain!important;
        -webkit-overflow-scrolling:touch!important;
        touch-action:pan-x!important;
        scrollbar-width:none!important;
        scroll-behavior:auto!important;
        padding-left:0!important;
        padding-right:0!important;
      }
      #pgFo > .dfAutoTopics::-webkit-scrollbar{display:none!important}
      #pgFo > .dfAutoTopics .dfAutoTopic{
        flex:0 0 auto!important;
        min-width:max-content!important;
        max-width:calc(100vw - 42px)!important;
        white-space:normal!important;
        overflow-wrap:anywhere!important;
      }
      @media(max-width:560px){
        #pgFo > .dfAutoTopics .dfAutoTopic{max-width:calc(100vw - 34px)!important}
      }
    `;
    document.head.appendChild(s);
  }

  function page(){return document.getElementById('pgFo')}
  function nav(){const p=page();return p&&p.querySelector(':scope > .dfAutoTopics')}

  function clampPageX(){
    if(Math.abs(window.scrollX||0)>1){
      const y=window.scrollY||0;
      window.scrollTo(0,y);
    }
  }

  function keepInside(btn,n){
    if(!btn||!n)return;
    const left=btn.offsetLeft;
    const right=left+btn.offsetWidth;
    const viewLeft=n.scrollLeft;
    const viewRight=viewLeft+n.clientWidth;
    if(left<viewLeft)n.scrollLeft=Math.max(0,left-8);
    else if(right>viewRight)n.scrollLeft=Math.max(0,right-n.clientWidth+8);
  }

  function bindNav(n){
    if(!n)return false;
    if(currentNav===n&&n.dataset.dfFormulaFixV2==='1')return true;
    currentNav=n;
    n.dataset.dfFormulaFixV2='1';

    n.addEventListener('click',function(e){
      const btn=e.target&&e.target.closest?e.target.closest('.dfAutoTopic'):null;
      if(!btn)return;
      const y=window.scrollY||0;
      requestAnimationFrame(function(){
        keepInside(btn,n);
        window.scrollTo(0,y);
        try{btn.blur()}catch(_e){}
        requestAnimationFrame(function(){window.scrollTo(0,y)});
      });
    },true);

    n.addEventListener('focusin',function(){
      const y=window.scrollY||0;
      requestAnimationFrame(function(){window.scrollTo(0,y)});
    },true);

    if(navObserver)navObserver.disconnect();
    navObserver=new MutationObserver(function(){
      requestAnimationFrame(function(){
        const active=n.querySelector('.dfAutoTopic.on');
        if(active)keepInside(active,n);
        clampPageX();
      });
    });
    navObserver.observe(n,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    clampPageX();
    return true;
  }

  function sync(){
    addStyle();
    const n=nav();
    if(n)bindNav(n);
    clampPageX();
  }

  function observePage(){
    const p=page();
    if(!p)return false;
    if(pageObserver)pageObserver.disconnect();
    pageObserver=new MutationObserver(function(){
      requestAnimationFrame(sync);
    });
    pageObserver.observe(p,{childList:true,subtree:true});
    sync();
    return true;
  }

  function start(){
    addStyle();
    if(!observePage()){
      let tries=0;
      const t=setInterval(function(){
        tries++;
        if(observePage()||tries>80)clearInterval(t);
      },100);
    }
    window.addEventListener('scroll',clampPageX,{passive:true});
    window.addEventListener('resize',sync,{passive:true});
    window.addEventListener('pageshow',function(){setTimeout(sync,0);setTimeout(sync,300)});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(sync,50)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',function(){setTimeout(observePage,50);setTimeout(sync,500)});
})();
