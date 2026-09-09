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
      if(d.getElementById('dfOpPageMaximizeStyle'))return true;

      const s=d.createElement('style');
      s.id='dfOpPageMaximizeStyle';
      s.textContent=`
        @media print{
          @page{size:A4 landscape!important;margin:0!important}
          html,body{
            width:297mm!important;height:210mm!important;
            margin:0!important;padding:0!important;
            background:#fff!important;overflow:hidden!important;
            -webkit-text-size-adjust:100%!important;text-size-adjust:100%!important;
          }
          .toolbar{display:none!important}
          .sheet{
            position:relative!important;
            width:295mm!important;
            height:202mm!important;
            min-height:202mm!important;
            max-height:202mm!important;
            margin:2mm auto 0!important;
            padding:1.5mm!important;
            box-shadow:none!important;
            transform:none!important;
            overflow:hidden!important;
            display:flex!important;
            flex-direction:column!important;
            justify-content:space-between!important;
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
            font-size:9px!important;
            line-height:.95!important;
            page-break-inside:avoid!important;
            break-inside:avoid-page!important;
            flex:0 0 auto!important;
          }
          .op td,.op th{
            border:.32mm solid #111!important;
            height:5.4mm!important;
            min-height:0!important;
            padding:.42mm .7mm!important;
            vertical-align:middle!important;
            line-height:.95!important;
          }
          .top td{height:6.8mm!important}
          .mat td,.mat th{height:5.7mm!important}
          .prod td,.prod th{height:5.6mm!important;font-size:7.2px!important}
          .codes td,.codes th{height:4.1mm!important;font-size:6.8px!important}
          .obs{height:7.2mm!important}
          .sectionGap{display:block!important;height:.25mm!important;min-height:0!important;flex:0 0 .25mm!important}
          .logo{font-size:14px!important;line-height:1!important}
          .title{font-size:9px!important}
          .xbig{font-size:13px!important;line-height:1!important}
          .big{font-size:11px!important;line-height:1!important}
          .value{font-size:10.5px!important;line-height:1!important}
          .miniTitle{font-size:6.8px!important;line-height:.95!important}
          .stamp{padding:.8mm 2mm!important;font-size:7px!important}
          .sheet,.sheet *{
            page-break-before:avoid!important;
            page-break-after:avoid!important;
            break-before:avoid-page!important;
            break-after:avoid-page!important;
          }
          body::before,body::after,html::before,html::after,.sheet::before,.sheet::after{
            content:none!important;display:none!important;
          }
        }
      `;
      d.head.appendChild(s);
      return true;
    }catch(e){return false;}
  }

  window.open=function(){
    const w=nativeOpen.apply(window,arguments);
    if(!w)return w;
    let n=0;
    const timer=setInterval(function(){
      n++;
      if(inject(w)||n>80||w.closed)clearInterval(timer);
    },25);
    try{w.addEventListener('beforeprint',function(){inject(w)})}catch(e){}
    return w;
  };
})();
