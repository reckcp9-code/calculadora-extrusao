(function(){
  'use strict';

  function addStyle(){
    if(document.getElementById('dfHomeCleanAfterNavStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomeCleanAfterNavStyle';
    s.textContent=`
      /* Na tela principal, os blocos das calculadoras não aparecem abaixo do menu. */
      body.dfHomeMode #appContent > .page,
      body.dfHomeMode #appContent > .foot{
        display:none!important;
      }
    `;
    document.head.appendChild(s);
  }

  function init(){
    addStyle();
    window.addEventListener('df-ui-ready',addStyle);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();