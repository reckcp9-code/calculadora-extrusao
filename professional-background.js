(function(){
  'use strict';
  if(document.getElementById('dfProfessionalBackgroundStyle'))return;

  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 2000" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#07111c"/>
        <stop offset="0.48" stop-color="#09131d"/>
        <stop offset="1" stop-color="#03070c"/>
      </linearGradient>
      <radialGradient id="glow" cx="82%" cy="18%" r="50%">
        <stop offset="0" stop-color="#ff9d18" stop-opacity=".28"/>
        <stop offset=".38" stop-color="#d96b00" stop-opacity=".10"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#263747"/>
        <stop offset=".2" stop-color="#a9b5bf"/>
        <stop offset=".45" stop-color="#344757"/>
        <stop offset=".7" stop-color="#d0d6db"/>
        <stop offset="1" stop-color="#1d2b37"/>
      </linearGradient>
      <linearGradient id="film" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#eef5fa" stop-opacity=".10"/>
        <stop offset=".5" stop-color="#d9e8f2" stop-opacity=".30"/>
        <stop offset="1" stop-color="#fff" stop-opacity=".08"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>
      <pattern id="grid" width="70" height="70" patternUnits="userSpaceOnUse">
        <path d="M70 0H0V70" fill="none" stroke="#93a7b8" stroke-opacity=".035" stroke-width="1"/>
      </pattern>
    </defs>

    <rect width="1200" height="2000" fill="url(#bg)"/>
    <rect width="1200" height="2000" fill="url(#grid)"/>
    <rect width="1200" height="2000" fill="url(#glow)"/>

    <g opacity=".22">
      <rect x="90" y="210" width="105" height="600" rx="36" fill="#253441"/>
      <rect x="235" y="145" width="130" height="720" rx="44" fill="#2d3c48"/>
      <rect x="410" y="265" width="95" height="570" rx="34" fill="#20303c"/>
      <g stroke="#7e93a5" stroke-opacity=".22" stroke-width="8">
        <path d="M140 180V90M300 130V55M455 250V145"/>
        <path d="M115 310H475M95 535H500"/>
      </g>
    </g>

    <ellipse cx="960" cy="310" rx="260" ry="235" fill="#ff920d" opacity=".07" filter="url(#blur)"/>

    <g transform="translate(715 120)">
      <rect x="105" y="0" width="255" height="1160" rx="30" fill="#0c131b" stroke="#526879" stroke-opacity=".32" stroke-width="5"/>
      <rect x="145" y="35" width="170" height="1010" rx="16" fill="#0a1118" stroke="#2e4354" stroke-width="3"/>
      <g fill="url(#steel)" opacity=".88">
        <rect x="20" y="330" width="430" height="48" rx="24"/>
        <rect x="25" y="500" width="420" height="52" rx="26"/>
        <rect x="15" y="675" width="440" height="54" rx="27"/>
        <rect x="25" y="850" width="420" height="52" rx="26"/>
      </g>
      <rect x="190" y="105" width="82" height="860" rx="35" fill="url(#film)" stroke="#dce8f0" stroke-opacity=".12"/>
      <path d="M206 120C160 300 330 340 210 520C120 660 330 720 205 950" fill="none" stroke="#f7fbff" stroke-opacity=".12" stroke-width="16"/>
      <g stroke="#ff9f1c" stroke-opacity=".36" stroke-width="5">
        <path d="M88 300H382M88 475H382M88 650H382M88 825H382"/>
      </g>
    </g>

    <g transform="translate(55 1430)" opacity=".50">
      <circle cx="205" cy="205" r="180" fill="#cfd9e0" fill-opacity=".14" stroke="#cfd9e0" stroke-opacity=".22" stroke-width="7"/>
      <circle cx="205" cy="205" r="55" fill="#090f15" stroke="#f3a122" stroke-opacity=".33" stroke-width="5"/>
      <circle cx="205" cy="205" r="135" fill="none" stroke="#e7eff5" stroke-opacity=".08" stroke-width="2"/>
      <circle cx="205" cy="205" r="105" fill="none" stroke="#e7eff5" stroke-opacity=".08" stroke-width="2"/>
      <circle cx="205" cy="205" r="78" fill="none" stroke="#e7eff5" stroke-opacity=".08" stroke-width="2"/>
    </g>

    <path d="M0 1270C220 1180 400 1245 590 1170C780 1095 940 1160 1200 1040V2000H0Z" fill="#02060a" opacity=".52"/>
    <rect y="0" width="1200" height="2000" fill="url(#bg)" opacity=".18"/>
  </svg>`;

  const bg='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  const st=document.createElement('style');
  st.id='dfProfessionalBackgroundStyle';
  st.textContent=`
    html{background:#03070c!important}
    body{
      min-height:100vh!important;
      background-color:#050a10!important;
      background-image:
        linear-gradient(180deg,rgba(2,6,11,.30),rgba(3,8,14,.55) 36%,rgba(3,7,12,.80) 100%),
        url("${bg}")!important;
      background-position:center top!important;
      background-size:cover!important;
      background-repeat:no-repeat!important;
      background-attachment:fixed!important;
    }
    #appContent,.w{position:relative}
    .card{
      background:linear-gradient(180deg,rgba(9,22,35,.90),rgba(5,12,20,.94))!important;
      border-color:rgba(83,110,133,.50)!important;
      box-shadow:0 18px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.028)!important;
      backdrop-filter:blur(9px)!important;
      -webkit-backdrop-filter:blur(9px)!important;
    }
    .tabs,.nav,.quick,.quickAccess{
      backdrop-filter:blur(12px)!important;
      -webkit-backdrop-filter:blur(12px)!important;
    }
    @media(max-width:650px){
      body{
        background-attachment:scroll!important;
        background-position:center top!important;
        background-size:auto 115vh!important;
      }
      .card{backdrop-filter:blur(7px)!important;-webkit-backdrop-filter:blur(7px)!important}
    }
  `;
  document.head.appendChild(st);
})();
