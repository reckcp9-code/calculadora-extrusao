(function(){
  'use strict';

  function install(){
    if(document.getElementById('dfMobileBackPositionStyle'))return;

    const s=document.createElement('style');
    s.id='dfMobileBackPositionStyle';
    s.textContent=`
      /* A seta antiga do cabeçalho fica definitivamente escondida.
         O VOLTAR agora existe somente dentro da barra de tópicos de cada módulo. */
      body.dfSectionMode #dfSectionBack{
        display:none!important;
        visibility:hidden!important;
        opacity:0!important;
        pointer-events:none!important;
        width:0!important;
        min-width:0!important;
        height:0!important;
        min-height:0!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
      }

      body.dfSectionMode #dfSectionHeader{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        position:static!important;
        min-height:40px!important;
        height:auto!important;
        margin:0 0 7px!important;
        padding:0!important;
        background:transparent!important;
        border:0!important;
        border-radius:0!important;
        box-shadow:none!important;
        -webkit-backdrop-filter:none!important;
        backdrop-filter:none!important;
      }

      body.dfSectionMode #dfSectionTitle{
        width:100%!important;
        margin:0!important;
        padding:0!important;
        text-align:center!important;
        font-size:21px!important;
        line-height:1.1!important;
        font-weight:950!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        pointer-events:none!important;
      }

      @media(max-width:640px){
        body.dfSectionMode #appContent{
          padding-top:44px!important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  window.addEventListener('df-ui-ready',install);
  setTimeout(install,250);
  setTimeout(install,800);
})();