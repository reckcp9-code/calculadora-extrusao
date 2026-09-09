(function(){
  'use strict';
  if(window.__dfOpOnePagePatchedV2)return;
  window.__dfOpOnePagePatchedV2=true;

  const realOpen=window.open.bind(window);

  window.open=function(){
    const w=realOpen.apply(window,arguments);
    if(!w)return w;
    try{
      const d=w.document;
      if(!d||d.__dfOnePageWrappedV2)return w;
      d.__dfOnePageWrappedV2=true;
      const realClose=d.close.bind(d);

      d.close=function(){
        realClose();
        try{
          setTimeout(function(){
            const sheet=d.querySelector('.sheet');
            const title=String(d.title||'');
            if(!sheet||!/^OP\s/i.test(title))return;

            let s=d.getElementById('dfIosOnePageFinalV2');
            if(!s){
              s=d.createElement('style');
              s.id='dfIosOnePageFinalV2';
              s.textContent=`
                @media print{
                  @page{size:A4 landscape!important;margin:2mm!important}
                  html,body{
                    margin:0!important;
                    padding:0!important;
                    width:293mm!important;
                    height:202mm!important;
                    min-height:202mm!important;
                    max-height:202mm!important;
                    overflow:hidden!important;
                    background:#fff!important;
                    -webkit-text-size-adjust:100%!important;
                    text-size-adjust:100%!important;
                  }
                  .toolbar{display:none!important}
                  .sheet{
                    display:block!important;
                    position:static!important;
                    width:418.5mm!important;
                    height:auto!important;
                    min-height:0!important;
                    max-height:none!important;
                    margin:0!important;
                    padding:1mm!important;
                    box-shadow:none!important;
                    overflow:visible!important;
                    transform:none!important;
                    transform-origin:top left!important;
                    zoom:.70!important;
                    page-break-before:avoid!important;
                    page-break-after:avoid!important;
                    page-break-inside:avoid!important;
                    break-before:avoid-page!important;
                    break-after:avoid-page!important;
                    break-inside:avoid-page!important;
                  }
                  .op{
                    width:100%!important;
                    font-size:8px!important;
                    line-height:.9!important;
                    margin:0!important;
                    page-break-inside:avoid!important;
                    break-inside:avoid-page!important;
                  }
                  .op td,.op th{
                    border:.35mm solid #111!important;
                    height:4.1mm!important;
                    min-height:0!important;
                    padding:.28mm .55mm!important;
                    font-size:inherit!important;
                    line-height:.9!important;
                  }
                  .top td{height:5.1mm!important}
                  .mat td,.mat th{height:4.05mm!important}
                  .prod td,.prod th{height:3.95mm!important;font-size:7.1px!important}
                  .codes td,.codes th{height:3.1mm!important;font-size:6.8px!important}
                  .obs{height:5.2mm!important}
                  .sectionGap{display:block!important;height:.2mm!important;min-height:0!important;flex:none!important}
                  .logo{font-size:13px!important;line-height:1!important}
                  .title{font-size:8px!important}
                  .xbig{font-size:12px!important;line-height:1!important}
                  .big{font-size:10px!important;line-height:1!important}
                  .value{font-size:9.5px!important;line-height:1!important}
                  .miniTitle{font-size:6.5px!important;line-height:.95!important}
                  .stamp{padding:.8mm 2mm!important;font-size:7px!important}
                  .sheet,.sheet *{
                    page-break-before:avoid!important;
                    page-break-after:avoid!important;
                    break-before:avoid-page!important;
                    break-after:avoid-page!important;
                  }
                }
              `;
              d.head.appendChild(s);
            }

            const forceOnePage=function(){
              try{
                const sh=d.querySelector('.sheet');
                if(!sh)return;
                sh.style.setProperty('zoom','.70','important');
                sh.style.setProperty('width','418.5mm','important');
                d.documentElement.style.setProperty('height','202mm','important');
                d.body.style.setProperty('height','202mm','important');
                d.body.style.setProperty('overflow','hidden','important');
              }catch(e){}
            };

            if(w.addEventListener)w.addEventListener('beforeprint',forceOnePage);
            forceOnePage();
          },30);
        }catch(e){}
      };
    }catch(e){}
    return w;
  };
})();
