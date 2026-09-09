(function(){
  'use strict';

  function install(){
    if(document.getElementById('dfMobileBackPositionStyle'))return;

    const s=document.createElement('style');
    s.id='dfMobileBackPositionStyle';
    s.textContent=`
      @media(max-width:640px){
        body.dfSectionMode #dfSectionHeader{
          display:flex!important;
          position:sticky!important;
          top:6px!important;
          z-index:90!important;
          min-height:64px!important;
          margin:0 0 12px!important;
          padding:6px 64px!important;
          box-sizing:border-box!important;
          align-items:center!important;
          justify-content:center!important;
          background:rgba(8,11,19,.94)!important;
          border:1px solid rgba(41,64,90,.72)!important;
          border-radius:16px!important;
          box-shadow:0 10px 26px rgba(0,0,0,.30)!important;
          -webkit-backdrop-filter:blur(10px)!important;
          backdrop-filter:blur(10px)!important;
        }

        body.dfSectionMode #dfSectionBack{
          position:absolute!important;
          left:7px!important;
          top:50%!important;
          transform:translateY(-50%)!important;
          width:52px!important;
          height:52px!important;
          min-width:52px!important;
          min-height:52px!important;
          flex:0 0 52px!important;
          margin:0!important;
          padding:0!important;
          border:2px solid #f5a000!important;
          border-radius:999px!important;
          background:#211400!important;
          color:#ffd36a!important;
          font-size:30px!important;
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
          transform:translateY(-50%) scale(.94)!important;
          background:#342000!important;
        }

        body.dfSectionMode #dfSectionTitle{
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

        body.dfSectionMode #appContent{
          padding-top:max(8px, env(safe-area-inset-top, 0px))!important;
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