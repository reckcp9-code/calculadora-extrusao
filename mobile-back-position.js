(function(){
  'use strict';

  function install(){
    if(document.getElementById('dfMobileBackPositionStyle'))return;

    const s=document.createElement('style');
    s.id='dfMobileBackPositionStyle';
    s.textContent=`
      @media(max-width:640px){
        body.dfSectionMode #appContent{
          padding-top:max(48px,calc(env(safe-area-inset-top, 0px) + 10px))!important;
        }

        body.dfSectionMode #dfSectionHeader{
          display:grid!important;
          grid-template-columns:54px minmax(0,1fr) 54px!important;
          gap:10px!important;
          position:sticky!important;
          top:max(48px,calc(env(safe-area-inset-top, 0px) + 10px))!important;
          z-index:90!important;
          min-height:58px!important;
          margin:0 0 16px!important;
          padding:4px 6px!important;
          box-sizing:border-box!important;
          align-items:center!important;
          background:rgba(8,11,19,.96)!important;
          border:1px solid rgba(41,64,90,.72)!important;
          border-radius:16px!important;
          box-shadow:0 10px 26px rgba(0,0,0,.28)!important;
          -webkit-backdrop-filter:blur(10px)!important;
          backdrop-filter:blur(10px)!important;
        }

        body.dfSectionMode #dfSectionBack{
          grid-column:1!important;
          position:static!important;
          transform:none!important;
          width:50px!important;
          height:50px!important;
          min-width:50px!important;
          min-height:50px!important;
          margin:0!important;
          padding:0!important;
          border:2px solid #f5a000!important;
          border-radius:999px!important;
          background:#211400!important;
          color:#ffd36a!important;
          font-size:29px!important;
          font-weight:950!important;
          line-height:1!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          box-shadow:0 5px 16px rgba(245,160,0,.18)!important;
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
          font-size:24px!important;
          line-height:1.1!important;
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
  setTimeout(install,400);
})();