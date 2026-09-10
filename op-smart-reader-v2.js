(function(){
  'use strict';

  let qrBase=null,tessBase=null,lastHint=null;
  const $=id=>document.getElementById(id);

  function makeCanvas(data,w,h){
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const x=c.getContext('2d',{willReadFrequently:true});
    x.putImageData(new ImageData(new Uint8ClampedArray(data),w,h),0,0);return c;
  }
  function imageData(c){const x=c.getContext('2d',{willReadFrequently:true});return x.getImageData(0,0,c.width,c.height)}
  function rotateCanvas(src,deg){
    deg=((deg%360)+360)%360;if(!deg)return src;
    const c=document.createElement('canvas'),swap=deg===90||deg===270;
    c.width=swap?src.height:src.width;c.height=swap?src.width:src.height;
    const x=c.getContext('2d',{willReadFrequently:true});x.save();
    if(deg===90){x.translate(c.width,0);x.rotate(Math.PI/2)}
    else if(deg===180){x.translate(c.width,c.height);x.rotate(Math.PI)}
    else if(deg===270){x.translate(0,c.height);x.rotate(-Math.PI/2)}
    x.drawImage(src,0,0);x.restore();return c;
  }
  function cropCanvas(src,x0,y0,w,h,scale){
    x0=Math.max(0,Math.round(x0));y0=Math.max(0,Math.round(y0));w=Math.max(1,Math.min(src.width-x0,Math.round(w)));h=Math.max(1,Math.min(src.height-y0,Math.round(h)));
    scale=Math.max(.6,Math.min(4,scale||1));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
    const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(src,x0,y0,w,h,0,0,c.width,c.height);return c;
  }
  function enhance(src,strong){
    const c=cropCanvas(src,0,0,src.width,src.height,1),x=c.getContext('2d',{willReadFrequently:true}),im=x.getImageData(0,0,c.width,c.height),d=im.data;
    const contrast=strong?1.78:1.42;
    for(let i=0;i<d.length;i+=4){const y=.299*d[i]+.587*d[i+1]+.114*d[i+2];let v=(y-128)*contrast+128;v=Math.max(0,Math.min(255,v));d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}x.putImageData(im,0,0);return c;
  }
  function paperBox(src){
    try{
      const x=src.getContext('2d',{willReadFrequently:true}),w=src.width,h=src.height,d=x.getImageData(0,0,w,h).data,step=Math.max(3,Math.floor(Math.max(w,h)/650));
      let minX=w,minY=h,maxX=0,maxY=0,count=0;
      for(let yy=0;yy<h;yy+=step)for(let xx=0;xx<w;xx+=step){const i=(yy*w+xx)*4,lum=.299*d[i]+.587*d[i+1]+.114*d[i+2],spread=Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]);if(lum>145&&spread<90){minX=Math.min(minX,xx);maxX=Math.max(maxX,xx);minY=Math.min(minY,yy);maxY=Math.max(maxY,yy);count++}}
      if(!count||maxX-minX<w*.35||maxY-minY<h*.3)return{x:0,y:0,w,h};
      const pad=step*3;return{x:Math.max(0,minX-pad),y:Math.max(0,minY-pad),w:Math.min(w,maxX+pad)-Math.max(0,minX-pad),h:Math.min(h,maxY+pad)-Math.max(0,minY-pad)};
    }catch(e){return{x:0,y:0,w:src.width,h:src.height}}
  }
  function qrCentroid(r){
    try{const l=r&&r.location;if(!l)return null;const p=[l.topLeftCorner,l.topRightCorner,l.bottomLeftCorner,l.bottomRightCorner].filter(Boolean);if(!p.length)return null;return{x:p.reduce((a,b)=>a+b.x,0)/p.length,y:p.reduce((a,b)=>a+b.y,0)/p.length}}catch(e){return null}
  }
  function callQR(c,base){
    const d=imageData(c);try{return base(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'})||null}catch(e){return null}
  }
  function scanTiles(src,base,rotation){
    let r=callQR(src,base);if(r)return{r,rotation,kind:'full',w:src.width,h:src.height};
    const b=paperBox(src),page=cropCanvas(src,b.x,b.y,b.w,b.h,Math.min(2.8,1500/Math.max(b.w,b.h)));
    r=callQR(page,base);if(r)return{r,rotation,kind:'paper',w:src.width,h:src.height};
    const positions=[0,.22,.44],frac=.56;
    for(const yy of positions)for(const xx of positions){
      const tw=Math.round(src.width*frac),th=Math.round(src.height*frac),x0=Math.round((src.width-tw)*(xx/.44||0)),y0=Math.round((src.height-th)*(yy/.44||0));
      const scale=Math.min(4,1400/Math.max(tw,th));const tile=cropCanvas(src,x0,y0,tw,th,scale);
      r=callQR(tile,base);if(r)return{r,rotation,kind:'tile',w:src.width,h:src.height};
      const bw=enhance(tile,true);r=callQR(bw,base);if(r)return{r,rotation,kind:'tile-contrast',w:src.width,h:src.height};
    }
    return null;
  }

  function installQR(){
    const current=window.jsQR;if(!current||current.__dfSmartV2)return false;
    qrBase=current;
    const smart=function(data,w,h,opts){
      try{const direct=qrBase(data,w,h,opts);if(direct){lastHint={data:direct.data||'',rotation:0,centroid:qrCentroid(direct),w,h,kind:'direct'};window.DF_OP_SMART_HINT=lastHint;return direct}}catch(e){}
      try{
        const src=makeCanvas(data,w,h);
        for(const deg of [0,270,90,180]){
          const rot=deg?rotateCanvas(src,deg):src,found=scanTiles(rot,qrBase,deg);
          if(found&&found.r){lastHint={data:found.r.data||'',rotation:deg,centroid:qrCentroid(found.r),w:rot.width,h:rot.height,kind:found.kind};window.DF_OP_SMART_HINT=lastHint;return found.r}
        }
      }catch(e){}
      return null;
    };
    smart.__dfSmartV2=true;smart.__dfEnhanced=true;window.jsQR=smart;return true;
  }

  function normalizePage(input){
    const b=paperBox(input);let page=cropCanvas(input,b.x,b.y,b.w,b.h,Math.min(2.2,2600/Math.max(b.w,b.h)));
    if(page.height>page.width){
      let deg=270;
      const hint=window.DF_OP_SMART_HINT||lastHint;
      if(hint&&hint.centroid&&hint.w){deg=hint.centroid.x>hint.w/2?270:90}
      page=rotateCanvas(page,deg);
    }
    return page;
  }
  async function runOCR(base,img,lang,opts,extra){
    try{return await base(img,lang,{...(opts||{}),...(extra||{})})}catch(e){return null}
  }
  function cleanText(s){return String(s||'').replace(/\r/g,'').trim()}

  function installTess(){
    if(!window.Tesseract||typeof window.Tesseract.recognize!=='function'||window.Tesseract.recognize.__dfSmartV2)return false;
    tessBase=window.Tesseract.recognize.bind(window.Tesseract);
    const smart=async function(image,lang,opts){
      if(!(image instanceof HTMLCanvasElement))return tessBase(image,lang,opts);
      const page=normalizePage(image),normal=enhance(page,false);
      let main=await runOCR(tessBase,normal,lang,opts,{});if(!main)main=await tessBase(image,lang,opts);
      let best=main,bestConf=Number(main&&main.data&&main.data.confidence||0);
      if(bestConf<58){const strong=enhance(page,true),r2=await runOCR(tessBase,strong,lang,{...(opts||{}),logger:undefined},{tessedit_pageseg_mode:'6'}),c2=Number(r2&&r2.data&&r2.data.confidence||0);if(r2&&c2>bestConf){best=r2;bestConf=c2}}

      // A OP tem layout fixo: reforça a leitura somente na faixa da tabela de produção
      // e no cabeçalho onde fica o identificador DFOP. O texto é anexado ao OCR geral
      // para o parser atual continuar funcionando sem quebrar o restante do app.
      try{
        const header=cropCanvas(page,page.width*.38,0,page.width*.42,page.height*.30,Math.min(2.4,1700/(page.width*.42)));
        const rh=await runOCR(tessBase,enhance(header,true),lang,{logger:undefined},{tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
        const table=cropCanvas(page,0,page.height*.68,page.width,page.height*.30,Math.min(2.4,2200/page.width));
        const rt=await runOCR(tessBase,enhance(table,true),lang,{logger:undefined},{tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
        const parts=[cleanText(best&&best.data&&best.data.text),cleanText(rh&&rh.data&&rh.data.text),cleanText(rt&&rt.data&&rt.data.text)].filter(Boolean);
        if(best&&best.data)best.data.text=parts.join('\n');
        const cs=[bestConf,Number(rh&&rh.data&&rh.data.confidence||0),Number(rt&&rt.data&&rt.data.confidence||0)].filter(Number.isFinite);
        if(best&&best.data&&cs.length)best.data.confidence=Math.max(...cs);
      }catch(e){}
      return best;
    };
    smart.__dfSmartV2=true;smart.__dfEnhanced=true;window.Tesseract.recognize=smart;return true;
  }

  function ensureBadge(){
    const bar=$('dfOpQualityBar');if(!bar||$('dfOpSmartV2'))return;
    const e=document.createElement('div');e.id='dfOpSmartV2';e.className='dfOpQualityPill ok';e.textContent='🧠 LEITOR V2: rotação + zoom QR + leitura por área';bar.appendChild(e);
  }
  function boot(){
    let n=0;const t=setInterval(()=>{installQR();installTess();ensureBadge();if(++n>120)clearInterval(t)},250);
    window.addEventListener('df-ui-ready',()=>setTimeout(()=>{installQR();installTess();ensureBadge()},300));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
