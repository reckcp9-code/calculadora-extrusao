(function(){
  'use strict';
  if(window.__dfOpPageMaximize)return;
  window.__dfOpPageMaximize=true;

  const nativeOpen=window.open.bind(window);

  function inject(win){
    try{
      if(!win||win.closed)return false;
      const d=win.document;
      if(!d)return false;
      const sheet=d.querySelector('.sheet');
      const title=String(d.title||'');
      if(!sheet||!/^OP\s/i.test(title))return false;

      let s=d.getElementById('dfOpPageMaximizeStyle');
      if(!s){
        s=d.createElement('style');
        s.id='dfOpPageMaximizeStyle';
        d.head.appendChild(s);
      }

      s.textContent=`
        @media print{
          @page{size:A4 landscape!important;margin:4mm!important}
          html,body{
            width:289mm!important;
            height:190mm!important;
            min-height:190mm!important;
            max-height:190mm!important;
            margin:0!important;
            padding:0!important;
            background:#fff!important;
            overflow:hidden!important;
            -webkit-text-size-adjust:100%!important;
            text-size-adjust:100%!important;
          }
          body{position:relative!important}
          .toolbar{display:none!important}
          .sheet{
            display:flex!important;
            flex-direction:column!important;
            justify-content:space-between!important;
            position:relative!important;
            width:289mm!important;
            height:184mm!important;
            min-height:184mm!important;
            max-height:184mm!important;
            margin:0!important;
            padding:1mm!important;
            box-shadow:none!important;
            transform:none!important;
            overflow:hidden!important;
            page-break-before:avoid!important;
            page-break-after:avoid!important;
            page-break-inside:avoid!important;
            break-before:avoid-page!important;
            break-after:avoid-page!important;
            break-inside:avoid-page!important;
          }
          .op{
            width:100%!important;
            max-width:100%!important;
            border-collapse:collapse!important;
            table-layout:fixed!important;
            margin:0!important;
            font-size:8.8px!important;
            line-height:.94!important;
            page-break-inside:avoid!important;
            break-inside:avoid-page!important;
            flex:0 0 auto!important;
          }
          .op td,.op th{
            border:.31mm solid #111!important;
            height:5.8mm!important;
            min-height:0!important;
            padding:.34mm .62mm!important;
            vertical-align:middle!important;
            line-height:.94!important;
          }
          .top td{height:6.8mm!important}
          .mat td,.mat th{height:6.2mm!important}
          .prod{margin:0!important}
          .prod td,.prod th{height:6.8mm!important;font-size:7.2px!important}
          .obs{height:8.2mm!important}
          .sectionGap{display:block!important;height:.18mm!important;min-height:0!important;flex:0 0 .18mm!important}

          /* Rodape removido: era o bloco que estava sendo jogado para a segunda pagina no Safari/iPhone. */
          .codes{display:none!important}

          .logo{font-size:13.5px!important;line-height:1!important}
          .title{font-size:8.8px!important}
          .xbig{font-size:12.3px!important;line-height:1!important}
          .big{font-size:10.4px!important;line-height:1!important}
          .value{font-size:10px!important;line-height:1!important}
          .miniTitle{font-size:6.5px!important;line-height:.94!important}
          .stamp{display:none!important}
          .sheet,.sheet *{
            page-break-before:avoid!important;
            page-break-after:avoid!important;
            page-break-inside:avoid!important;
            break-before:avoid-page!important;
            break-after:avoid-page!important;
            break-inside:avoid-page!important;
          }
          body::before,body::after,html::before,html::after,.sheet::before,.sheet::after{
            content:none!important;
            display:none!important;
          }
        }
      `;
      return true;
    }catch(e){return false;}
  }

  window.open=function(){
    const w=nativeOpen.apply(window,arguments);
    if(!w)return w;
    let n=0;
    const timer=setInterval(function(){
      n++;
      if(inject(w)||n>120||w.closed)clearInterval(timer);
    },20);
    try{
      w.addEventListener('beforeprint',function(){inject(w)});
      w.addEventListener('load',function(){inject(w)});
    }catch(e){}
    return w;
  };
})();
