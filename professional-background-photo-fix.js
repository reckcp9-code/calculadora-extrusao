(function(){
  'use strict';
  if(document.getElementById('dfProfessionalPhotoFix'))return;
  const s=document.createElement('style');
  s.id='dfProfessionalPhotoFix';
  s.textContent=`
    body{
      background:
        linear-gradient(180deg,rgba(2,6,10,.26),rgba(3,8,14,.52) 42%,rgba(3,7,12,.78) 100%),
        url('https://raw.githubusercontent.com/reckcp9-code/calculadora-extrusao/teste/df-industrial-bg.webp') center top/cover fixed no-repeat!important;
    }
    @media(max-width:650px){body{background-attachment:scroll!important;background-position:center top!important;background-size:auto 105vh!important}}
  `;
  document.head.appendChild(s);
})();
