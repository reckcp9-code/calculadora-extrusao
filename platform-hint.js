(function(){
  'use strict';

  const API_HOST='df-extrusor-api.reck-cp9.workers.dev';
  const previousFetch=window.fetch.bind(window);

  function detectPlatform(){
    try{
      const ua=String(navigator.userAgent||'');
      const navPlatform=String(navigator.platform||'');
      const uaDataPlatform=String(navigator.userAgentData&&navigator.userAgentData.platform||'');
      const all=ua+' '+navPlatform+' '+uaDataPlatform;
      const touches=Number(navigator.maxTouchPoints||0);
      const sw=Number(screen&&screen.width||0),sh=Number(screen&&screen.height||0);
      const shortSide=sw&&sh?Math.min(sw,sh):0;

      if(/iPhone|iPod/i.test(all))return 'iOS';
      if(/iPad/i.test(all))return 'iPad';
      if(/Android/i.test(all))return 'Android';

      // Safari no iPhone/iPad pode se anunciar como Macintosh quando está em
      // "Solicitar Site para Computador". Macs reais normalmente não têm touch.
      const appleDesktopMask=/MacIntel|Macintosh|MacPPC|Mac68K/i.test(all)&&touches>1;
      if(appleDesktopMask){
        return shortSide>0&&shortSide<600?'iOS':'iPad';
      }

      if(/Windows|Win32|Win64|CrOS|X11|Linux|MacIntel|Macintosh|MacPPC|Mac68K/i.test(all))return 'PC';
      return 'Outro';
    }catch(e){
      return 'Outro';
    }
  }

  const platform=detectPlatform();
  window.DF_PLATFORM_HINT=platform;

  window.fetch=function(input,init){
    try{
      const u=new URL(typeof input==='string'?input:input&&input.url,location.href);
      if(u.hostname===API_HOST){
        const h=new Headers(init&&init.headers||{});
        h.set('X-DF-Platform',platform);
        init={...(init||{}),headers:h};
      }
    }catch(e){}
    return previousFetch(input,init);
  };
})();
