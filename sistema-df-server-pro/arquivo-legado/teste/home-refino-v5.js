(function(){
  'use strict';
  if(document.getElementById('dfHomeRefinoV5Style'))return;
  const s=document.createElement('style');
  s.id='dfHomeRefinoV5Style';
  s.textContent=`
    /* TESTE V5 — preserva o layout V4 e refina somente imagem + contornos */

    /* Mostra a arte inteira da empresa, sem cortar nenhuma parte. */
    body.dfHomeCompact .brand .logo,
    body:not(.dfSectionMode) .brand .logo{
      width:100%!important;
      max-width:none!important;
      height:238px!important;
      object-fit:contain!important;
      object-position:center center!important;
      background:#000!important;
    }

    /* Contorno premium: branco técnico passando para o laranja DF. */
    body.dfHomeCompact #appContent>.tabs .tab,
    body:not(.dfSectionMode) #appContent>.tabs .tab{
      border:1.5px solid transparent!important;
      background:
        linear-gradient(145deg,#141e2c 0%,#101824 62%,#0d1520 100%) padding-box,
        linear-gradient(135deg,
          rgba(248,250,252,.92) 0%,
          rgba(248,250,252,.72) 34%,
          rgba(215,165,38,.88) 68%,
          #f0ad20 100%) border-box!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.045),
        0 8px 22px rgba(0,0,0,.22),
        0 0 0 .5px rgba(215,165,38,.10)!important;
    }
    #btEx,#btFo,#btSa,#btCu{border-color:transparent!important}

    /* O pequeno identificador EX / FO / SA / R$ acompanha o mesmo acabamento. */
    body.dfHomeCompact #appContent>.tabs .tab::before,
    body:not(.dfSectionMode) #appContent>.tabs .tab::before{
      border:1.25px solid transparent!important;
      background:
        linear-gradient(#0b111a,#0b111a) padding-box,
        linear-gradient(135deg,#f8fafc 0%,#cfd5dc 42%,#d7a526 68%,#f0ad20 100%) border-box!important;
      color:#e0ad2e!important;
    }

    body.dfHomeCompact #appContent>.tabs .tab:active,
    body:not(.dfSectionMode) #appContent>.tabs .tab:active{
      background:
        linear-gradient(145deg,#172230 0%,#111a26 65%,#0e1621 100%) padding-box,
        linear-gradient(135deg,#ffffff 0%,#dfe3e8 35%,#e5b13a 70%,#f0ad20 100%) border-box!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.06),
        0 6px 16px rgba(0,0,0,.24)!important;
    }

    @media(max-width:390px){
      body.dfHomeCompact .brand .logo,
      body:not(.dfSectionMode) .brand .logo{height:220px!important}
    }
    @media(min-width:700px){
      body.dfHomeCompact .brand .logo,
      body:not(.dfSectionMode) .brand .logo{height:270px!important}
    }
  `;
  document.head.appendChild(s);
})();