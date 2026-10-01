(function(){
  'use strict';

  function addStyle(){
    if(document.getElementById('dfHomePolishV2Style'))return;
    const st=document.createElement('style');
    st.id='dfHomePolishV2Style';
    st.textContent=`
      /* Banner beta removido somente da tela principal. */
      #dfBetaApp{display:none!important}

      /* Quatro botoes principais levemente maiores, mantendo o layout compacto. */
      #appContent > .tabs{
        gap:10px!important;
        padding:8px!important;
        border:1px solid #2f3b4e!important;
        border-radius:18px!important;
        background:#090d14f2!important;
      }
      #appContent > .tabs > .tab{
        min-height:64px!important;
        padding:14px 7px!important;
        border:2px solid #40516b!important;
        border-radius:14px!important;
        background:linear-gradient(180deg,#162033 0%,#111827 100%)!important;
        color:#d8e1ee!important;
        font-size:12px!important;
        font-weight:950!important;
        letter-spacing:.02em!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 5px 14px rgba(0,0,0,.20)!important;
      }
      #appContent > .tabs > .tab.on{
        border-color:#f5a000!important;
        background:linear-gradient(180deg,#2d1d04 0%,#211400 100%)!important;
        color:#ffd36a!important;
        box-shadow:inset 0 0 0 1px rgba(245,160,0,.20),0 5px 16px rgba(245,160,0,.10)!important;
      }
      #appContent > .tabs > .tab:active{transform:scale(.97)!important}

      @media(max-width:560px){
        #appContent > .tabs{gap:8px!important;padding:7px!important}
        #appContent > .tabs > .tab{
          min-height:62px!important;
          padding:12px 4px!important;
          font-size:11.5px!important;
          border-width:2px!important;
        }
      }
    `;
    document.head.appendChild(st);
  }

  function removeHomeBeta(){
    const beta=document.getElementById('dfBetaApp');
    if(beta)beta.remove();
  }

  function sync(){addStyle();removeHomeBeta()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
  window.addEventListener('df-ui-ready',sync);
  setTimeout(sync,150);
  setTimeout(sync,700);
  setTimeout(sync,1600);
})();