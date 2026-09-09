(function(){
  'use strict';
  if(document.getElementById('dfProfessionalPhotoFix'))return;

  const IMG='https://raw.githubusercontent.com/reckcp9-code/calculadora-extrusao/teste/df-industrial-bg.webp?v=2';

  const preload=document.createElement('link');
  preload.rel='preload';
  preload.as='image';
  preload.href=IMG;
  document.head.appendChild(preload);

  const s=document.createElement('style');
  s.id='dfProfessionalPhotoFix';
  s.textContent=`
    html{
      min-height:100%!important;
      background:#03070c url("${IMG}") center top/cover no-repeat!important;
    }
    body{
      min-height:100vh!important;
      background-color:#03070c!important;
      background-image:
        linear-gradient(180deg,rgba(2,6,10,.16),rgba(3,8,14,.38) 42%,rgba(3,7,12,.70) 100%),
        url("${IMG}")!important;
      background-position:center top!important;
      background-size:cover!important;
      background-repeat:no-repeat!important;
      background-attachment:fixed!important;
    }
    @media(max-width:650px){
      html{background-position:center top!important;background-size:auto 100vh!important}
      body{
        background-attachment:scroll!important;
        background-position:center top!important;
        background-size:auto 100vh!important;
      }
    }
  `;
  document.head.appendChild(s);

  function force(){
    try{
      const bg='linear-gradient(180deg,rgba(2,6,10,.16),rgba(3,8,14,.38) 42%,rgba(3,7,12,.70) 100%), url("'+IMG+'")';
      document.body.style.setProperty('background-image',bg,'important');
      document.body.style.setProperty('background-position','center top','important');
      document.body.style.setProperty('background-repeat','no-repeat','important');
      document.body.style.setProperty('background-size',matchMedia('(max-width:650px)').matches?'auto 100vh':'cover','important');
    }catch(e){}
  }

  const test=new Image();
  test.onload=force;
  test.src=IMG;
  force();
  window.addEventListener('df-ui-ready',force);
  window.addEventListener('pageshow',force);
  setTimeout(force,300);
  setTimeout(force,1200);
})();
