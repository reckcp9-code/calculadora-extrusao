(function(){
  'use strict';

  function install(){
    const back=document.getElementById('dfSectionBack');
    if(back){
      back.textContent='← VOLTAR';
      back.setAttribute('aria-label','Voltar para o menu');
    }

    if(document.getElementById('dfMobileBackPositionStyle'))return;

    const s=document.createElement('style');
    s.id='dfMobileBackPositionStyle';
    s.textContent=`
      @media(max-width:640px){
        body.dfSectionMode #appContent{
          padding-top:12px!important;
        }

        body.dfSectionMode #dfSectionHeader{
          display:flex!important;
          flex-direction:column!important;
          align-items:stretch!important;
          gap:10px!important;
          position:static!important;
          min-height:0!important;
          margin:0 0 14px!important;
          padding:0!important;
          background:transparent!important;
          border:0!important;
          border-radius:0!important;
          box-shadow:none!important;
          -webkit-backdrop-filter:none!important;
          backdrop-filter:none!important;
        }

        body.dfSectionMode #dfSectionTitle{
          order:1!important;
          width:100%!important;
          margin:0!important;
          padding:2px 4px 0!important;
          text-align:center!important;
          font-size:26px!important;
          line-height:1.12!important;
          font-weight:950!important;
          white-space:nowrap!important;
          overflow:hidden!important;
          text-overflow:ellipsis!important;
          pointer-events:none!important;
        }

        body.dfSectionMode #dfSectionBack{
          order:2!important;
          position:static!important;
          transform:none!important;
          align-self:flex-start!important;
          width:auto!important;
          min-width:118px!important;
          height:46px!important;
          min-height:46px!important;
          margin:0!important;
          padding:0 16px!important;
          border:1px solid #f5a000!important;
          border-radius:13px!important;
          background:linear-gradient(180deg,#2a1a00,#1c1100)!important;
          color:#ffd36a!important;
          font-size:15px!important;
          font-weight:950!important;
          letter-spacing:.2px!important;
          line-height:1!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          box-shadow:none!important;
          touch-action:manipulation!important;
          -webkit-tap-highlight-color:transparent!important;
        }

        body.dfSectionMode #dfSectionBack:active{
          transform:scale(.97)!important;
          background:#342000!important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  window.addEventListener('df-ui-ready',install);
  setTimeout(install,300);
  setTimeout(install,900);
})();