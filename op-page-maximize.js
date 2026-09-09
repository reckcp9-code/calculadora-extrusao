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
          @page{size:A4 landscape!important;margin:2mm!important}
          html,body{
            width:293mm!important;
            height:206mm!important;
            min-height:206mm!important;
            max-height:206mm!important;
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
            display:block!important;
            position:relative!important;
            width:293mm!important;
            height:204mm!important;
            min-height:204mm!important;
            max-height:204mm!important;
            margin:0!important;
            padding:1mm 0 7mm!important;
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
            font-size:8.1px!important;
            line-height:.9!important;
            page-break-inside:avoid!important;
            break-inside:avoid-page!important;
          }
          .op td,.op th{
            border:.30mm solid #111!important;
            height:4.45mm!important;
            min-height:0!important;
            padding:.28mm .55mm!important;
            vertical-align:middle!important;
            line-height:.9!important;
          }
          .top td{height:5.65mm!important}
          .mat td,.mat th{height:4.45mm!important}
          .prod{margin-bottom:7mm!important}
          .prod td,.prod th{height:4.1mm!important;font-size:6.9px!important}
          .obs{height:5.8mm!important}
          .sectionGap{display:block!important;height:.15mm!important;min-height:0!important;flex:none!important}
          .codes{
            position:absolute!important;
            left:0!important;
            right:0!important;
            bottom:0!important;
            width:100%!important;
            margin:0!important;
          }
          .codes td,.codes th{height:3.2mm!important;font-size:6.4px!important;padding:.18mm .4mm!important}
          .logo{font-size:12.5px!important;line-height:1!important}
          .title{font-size:8.2px!important}
          .xbig{font-size:11.5px!important;line-height:1!important}
          .big{font-size:9.8px!important;line-height:1!important}
          .value{font-size:9.4px!important;line-height:1!important}
          .miniTitle{font-size:6.2px!important;line-height:.92!important}
          .stamp{padding:.6mm 1.6mm!important;font-size:6.4px!important}
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
