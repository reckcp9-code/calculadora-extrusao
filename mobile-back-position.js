(function(){
  'use strict';

  function install(){
    const back=document.getElementById('dfSectionBack');
    if(back){
      back.textContent='←';
      back.setAttribute('aria-label','Voltar para o menu');
      back.setAttribute('title','Voltar');
    }

    if(document.getElementById('dfMobileBackPositionStyle'))return;

    const s=document.createElement('style');
    s.id='dfMobileBackPositionStyle';
    s.textContent=`
      @media(max-width:640px){
        body.dfSectionMode #appContent{
          padding-top:44px!important;
        }

        body.dfSectionMode #dfSectionHeader{
          display:grid!important;
          grid-template-columns:40px minmax(0,1fr) 40px!important;
          align-items:center!important;
          gap:6px!important;
          position:static!important;
          min-height:40px!important;
          height:40px!important;
          margin:0 0 7px!important;
          padding:0!important;
          background:transparent!important;
          border:0!important;
          border-radius:0!important;
          box-shadow:none!important;
          -webkit-backdrop-filter:none!important;
          backdrop-filter:none!important;
        }

        body.dfSectionMode #dfSectionBack{
          grid-column:1!important;
          position:static!important;
          transform:none!important;
          width:38px!important;
          height:38px!important;
          min-width:38px!important;
          min-height:38px!important;
          margin:0!important;
          padding:0!important;
          border:1px solid #f5a000!important;
          border-radius:999px!important;
          background:#211400!important;
          color:#ffd36a!important;
          font-size:24px!important;
          font-weight:900!important;
          line-height:1!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          box-shadow:none!important;
          touch-action:manipulation!important;
          -webkit-tap-highlight-color:transparent!important;
        }

        body.dfSectionMode #dfSectionBack:active{
          transform:scale(.94)!important;
          background:#342000!important;
        }

        body.dfSectionMode #dfSectionTitle{
          grid-column:2!important;
          width:100%!important;
          margin:0!important;
          padding:0!important;
          text-align:center!important;
          font-size:21px!important;
          line-height:1!important;
          font-weight:950!important;
          white-space:nowrap!important;
          overflow:hidden!important;
          text-overflow:ellipsis!important;
          pointer-events:none!important;
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