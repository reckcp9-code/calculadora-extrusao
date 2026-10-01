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

  function start(){
    style();
    if(bind())return;
    let tries=0;
    const t=setInterval(function(){tries++;if(bind()||tries>50)clearInterval(t)},100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',function(){setTimeout(bind,50);setTimeout(bind,500)},{once:true});
})();
