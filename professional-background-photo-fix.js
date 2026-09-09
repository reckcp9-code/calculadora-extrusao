(function(){
  'use strict';
  if(document.getElementById('dfProfessionalPhotoFix'))return;

  const IMG='https://raw.githubusercontent.com/reckcp9-code/calculadora-extrusao/teste/df-industrial-bg.jpg?v=6';

  const s=document.createElement('style');
  s.id='dfProfessionalPhotoFix';
  s.textContent=`
    html{
      min-height:100%!important;
      background-color:#03070c!important;
      background-image:
        linear-gradient(180deg,rgba(2,6,10,.14),rgba(3,8,14,.34) 45%,rgba(3,7,12,.68) 100%),
        url("${IMG}")!important;
      background-position:center top!important;
      background-size:cover!important;
      background-repeat:no-repeat!important;
      background-attachment:fixed!important;
    }
    body{
      min-height:100vh!important;
      background:transparent!important;
    }
    #appContent,.w{background:transparent!important}
    @media(max-width:650px){
      html{
        background-attachment:scroll!important;
        background-position:center top!important;
        background-size:auto 100vh!important;
      }
    }
  `;
  document.head.appendChild(s);

  function force(){
    try{
      document.documentElement.style.setProperty('background-color','#03070c','important');
      document.documentElement.style.setProperty('background-image','linear-gradient(180deg,rgba(2,6,10,.14),rgba(3,8,14,.34) 45%,rgba(3,7,12,.68) 100%), url("'+IMG+'")','important');
      document.documentElement.style.setProperty('background-position','center top','important');
      document.documentElement.style.setProperty('background-repeat','no-repeat','important');
      document.documentElement.style.setProperty('background-size',matchMedia('(max-width:650px)').matches?'auto 100vh':'cover','important');
      document.body.style.setProperty('background','transparent','important');
      const app=document.getElementById('appContent');
      if(app)app.style.setProperty('background','transparent','important');
    }catch(e){}
  }

  const img=new Image();
  img.onload=force;
  img.src=IMG;
  force();
  window.addEventListener('df-ui-ready',force);
  window.addEventListener('pageshow',force);
  setTimeout(force,250);
  setTimeout(force,900);
})();
