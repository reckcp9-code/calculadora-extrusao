(function(){
  'use strict';
  if(window.__dfOpOnePagePatched)return;
  window.__dfOpOnePagePatched=true;

  const realOpen=window.open.bind(window);

  window.open=function(){
    const w=realOpen.apply(window,arguments);
    if(!w)return w;
    try{
      const d=w.document;
      if(!d||d.__dfOnePageWrapped)return w;
      d.__dfOnePageWrapped=true;
      const realClose=d.close.bind(d);
      d.close=function(){
        realClose();
        try{
          setTimeout(function(){
            const sheet=d.querySelector('.sheet');
            const title=String(d.title||'');
            if(!sheet||!/^OP\s/i.test(title))return;
            let s=d.getElementById('dfIosOnePageFinal');
            if(!s){
              s=d.createElement('style');
              s.id='dfIosOnePageFinal';
              s.textContent=`
                @media print{
                  @page{size:A4 landscape!important;margin:3mm!important}
                  html,body{
                    margin:0!important;padding:0!important;
                    width:291mm!important;height:auto!important;min-height:0!important;
                    overflow:visible!important;background:#fff!important;
                    -webkit-text-size-adjust:100%!important;text-size-adjust:100%!important;
                  }
                  .toolbar{display:none!important}
                  .sheet{
                    display:block!important;position:static!important;
                    width:291mm!important;height:auto!important;min-height:0!important;max-height:none!important;
                    margin:0!important;padding:1mm!important;box-shadow:none!important;
                    overflow:visible!important;transform:none!important;
                    page-break-before:avoid!important;page-break-after:avoid!important;page-break-inside:avoid!important;
                    break-before:avoid-page!important;break-after:avoid-page!important;break-inside:avoid-page!important;
                  }
                  .op{
                    width:100%!important;font-size:7.2px!important;line-height:.86!important;
                    margin:0!important;page-break-inside:avoid!important;break-inside:avoid-page!important;
                    -webkit-text-size-adjust:100%!important;
                  }
                  .op td,.op th{
                    border:.30mm solid #111!important;
                    height:3.55mm!important;min-height:0!important;
                    padding:.18mm .45mm!important;
                    font-size:inherit!important;line-height:.86!important;
                  }
                  .top td{height:4.55mm!important}
                  .mat td,.mat th{height:3.55mm!important}
                  .prod td,.prod th{height:3.45mm!important;font-size:6.5px!important}
                  .codes td,.codes th{height:2.85mm!important;font-size:6.2px!important}
                  .obs{height:4.7mm!important}
                  .sectionGap{display:block!important;height:.15mm!important;min-height:0!important;flex:none!important}
                  .logo{font-size:12px!important;line-height:1!important}
                  .title{font-size:7.5px!important}
                  .xbig{font-size:11px!important;line-height:1!important}
                  .big{font-size:9px!important;line-height:1!important}
                  .value{font-size:8.5px!important;line-height:1!important}
                  .miniTitle{font-size:6px!important;line-height:.9!important}
                  .stamp{padding:.8mm 2mm!important;font-size:6.5px!important}
                  .sheet,.sheet *{page-break-before:avoid!important;page-break-after:avoid!important;break-before:avoid-page!important;break-after:avoid-page!important}
                }
              `;
              d.head.appendChild(s);
            }
          },30);
        }catch(e){}
      };
    }catch(e){}
    return w;
  };
})();
