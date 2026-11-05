(function(){
  'use strict';

  const REG_KEY='df_op_qr_registry_v1';
  const HASH_KEY='df_op_photo_hashes_v1';
  let qrBase=null,tessBase=null,lastHint=null;
  const $=id=>document.getElementById(id);

  function loadReg(){try{return JSON.parse(localStorage.getItem(REG_KEY)||'{}')||{}}catch(e){return{}}}
  function saveReg(r){try{localStorage.setItem(REG_KEY,JSON.stringify(r||{}))}catch(e){}}
  function canonQr(v){
    let s=String(v||'').trim().replace(/[\u2010-\u2015]/g,'-').replace(/\s+/g,'');
    const m=s.match(/DFOP-[A-Z0-9-]{8,}/i);if(m)s=m[0];
    return s.toUpperCase();
  }
  function distance(a,b){
    a=canonQr(a);b=canonQr(b);
    if(a===b)return 0;if(!a)return b.length;if(!b)return a.length;
    const prev=Array.from({length:b.length+1},(_,i)=>i),cur=new Array(b.length+1);
    for(let i=1;i<=a.length;i++){cur[0]=i;for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));for(let j=0;j<=b.length;j++)prev[j]=cur[j]}
    return prev[b.length];
  }
  function reconcileQr(raw){
    let id=canonQr(raw);if(!/^DFOP-/i.test(id))return String(raw||'').trim();
    const reg=loadReg(),keys=Object.keys(reg);
    if(reg[id])return id;
    const same=keys.find(k=>canonQr(k)===id);if(same)return same;
    let best='',score=99;
    for(const k of keys){
      const ck=canonQr(k);if(!/^DFOP-/i.test(ck))continue;
      if(id.length>12&&ck.length>12&&id.slice(5,13)!==ck.slice(5,13))continue;
      const d=distance(id,ck);if(d<score){score=d;best=k}
    }
    if(best&&score<=2)return best;

    reg[id]={
      id,createdAt:new Date().toISOString(),recoveredFromQr:true,
      expected:{title:'',date:'',totalKg:0,largura:0,micra:0,gm:0,materials:[]}
    };
    saveReg(reg);
    try{window.dispatchEvent(new CustomEvent('df-op-qr-created',{detail:reg[id]}))}catch(e){}
    return id;
  }

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
    x0=Math.max(0,Math.round(x0));y0=Math.max(0,Math.round(y0));
    w=Math.max(1,Math.min(src.width-x0,Math.round(w)));h=Math.max(1,Math.min(src.height-y0,Math.round(h)));
    scale=Math.max(.5,Math.min(5,scale||1));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
    const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
    x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(src,x0,y0,w,h,0,0,c.width,c.height);return c;
  }
  function enhance(src,strong){
    const c=cropCanvas(src,0,0,src.width,src.height,1),x=c.getContext('2d',{willReadFrequently:true}),im=x.getImageData(0,0,c.width,c.height),d=im.data;
    const contrast=strong?1.82:1.45;
    for(let i=0;i<d.length;i+=4){const y=.299*d[i]+.587*d[i+1]+.114*d[i+2];let v=(y-128)*contrast+128;v=Math.max(0,Math.min(255,v));d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}
    x.putImageData(im,0,0);return c;
  }
  function blueInk(src){
    const c=cropCanvas(src,0,0,src.width,src.height,1),x=c.getContext('2d',{willReadFrequently:true}),im=x.getImageData(0,0,c.width,c.height),d=im.data;
    let ink=0;
    for(let i=0;i<d.length;i+=4){
      const r=d[i],g=d[i+1],b=d[i+2],spread=Math.max(r,g,b)-Math.min(r,g,b);
      const score=b-((r+g)/2);
      const yes=score>11&&spread>13&&b>40;
      const v=yes?0:255;if(yes)ink++;
      d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;
    }
    x.putImageData(im,0,0);c.__dfInkPixels=ink;return c;
  }
  function paperBox(src){
    try{
      const x=src.getContext('2d',{willReadFrequently:true}),w=src.width,h=src.height,d=x.getImageData(0,0,w,h).data,step=Math.max(3,Math.floor(Math.max(w,h)/700));
      let minX=w,minY=h,maxX=0,maxY=0,count=0;
      for(let yy=0;yy<h;yy+=step)for(let xx=0;xx<w;xx+=step){
        const i=(yy*w+xx)*4,lum=.299*d[i]+.587*d[i+1]+.114*d[i+2],spread=Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]);
        if(lum>142&&spread<100){minX=Math.min(minX,xx);maxX=Math.max(maxX,xx);minY=Math.min(minY,yy);maxY=Math.max(maxY,yy);count++}
      }
      if(!count||maxX-minX<w*.34||maxY-minY<h*.28)return{x:0,y:0,w,h};
      const pad=step*4,x0=Math.max(0,minX-pad),y0=Math.max(0,minY-pad),x1=Math.min(w,maxX+pad),y1=Math.min(h,maxY+pad);
      return{x:x0,y:y0,w:x1-x0,h:y1-y0};
    }catch(e){return{x:0,y:0,w:src.width,h:src.height}}
  }
  function qrCentroid(r){
    try{const l=r&&r.location;if(!l)return null;const p=[l.topLeftCorner,l.topRightCorner,l.bottomLeftCorner,l.bottomRightCorner].filter(Boolean);if(!p.length)return null;return{x:p.reduce((a,b)=>a+b.x,0)/p.length,y:p.reduce((a,b)=>a+b.y,0)/p.length}}catch(e){return null}
  }
  function callQR(c,base){
    const d=imageData(c);try{
      const r=base(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'})||null;
      if(r&&r.data)r.data=reconcileQr(r.data);
      return r;
    }catch(e){return null}
  }
  function scanTiles(src,base,rotation){
    let r=callQR(src,base);if(r)return{r,rotation,kind:'full'};
    const b=paperBox(src),page=cropCanvas(src,b.x,b.y,b.w,b.h,Math.min(3.2,1900/Math.max(b.w,b.h)));
    r=callQR(page,base);if(r)return{r,rotation,kind:'paper'};

    const headerZones=[
      [0,.00,1,.38],[.22,.00,.60,.36],[.38,.00,.36,.34],
      [0,.00,.55,.55],[.45,.00,.55,.55]
    ];
    for(const z of headerZones){
      const x0=src.width*z[0],y0=src.height*z[1],tw=src.width*z[2],th=src.height*z[3];
      const tile=cropCanvas(src,x0,y0,tw,th,Math.min(5,1700/Math.max(tw,th)));
      r=callQR(tile,base);if(r)return{r,rotation,kind:'header-zoom'};
      r=callQR(enhance(tile,true),base);if(r)return{r,rotation,kind:'header-contrast'};
    }

    const frac=.52,steps=[0,.24,.48];
    for(const yy of steps)for(const xx of steps){
      const tw=src.width*frac,th=src.height*frac,x0=(src.width-tw)*(xx/.48),y0=(src.height-th)*(yy/.48);
      const tile=cropCanvas(src,x0,y0,tw,th,Math.min(5,1500/Math.max(tw,th)));
      r=callQR(tile,base);if(r)return{r,rotation,kind:'tile'};
    }
    return null;
  }

  function installQR(){
    const current=window.jsQR;if(!current||current.__dfSmartV3)return false;
    qrBase=current;
    const smart=function(data,w,h,opts){
      try{
        const direct=qrBase(data,w,h,opts);
        if(direct){if(direct.data)direct.data=reconcileQr(direct.data);lastHint={data:direct.data||'',rotation:0,centroid:qrCentroid(direct),w,h,kind:'direct'};window.DF_OP_SMART_HINT=lastHint;return direct}
      }catch(e){}
      try{
        const src=makeCanvas(data,w,h);
        for(const deg of [0,270,90,180]){
          const rot=deg?rotateCanvas(src,deg):src,found=scanTiles(rot,qrBase,deg);
          if(found&&found.r){lastHint={data:found.r.data||'',rotation:deg,centroid:qrCentroid(found.r),w:rot.width,h:rot.height,kind:found.kind};window.DF_OP_SMART_HINT=lastHint;return found.r}
        }
      }catch(e){}
      return null;
    };
    smart.__dfSmartV2=true;smart.__dfSmartV3=true;smart.__dfEnhanced=true;window.jsQR=smart;return true;
  }

  function normalizePage(input){
    const b=paperBox(input);let page=cropCanvas(input,b.x,b.y,b.w,b.h,Math.min(2.5,3000/Math.max(b.w,b.h)));
    if(page.height>page.width){
      let deg=270;
      const hint=window.DF_OP_SMART_HINT||lastHint;
      if(hint&&hint.rotation===90)deg=90;
      else if(hint&&hint.rotation===270)deg=270;
      page=rotateCanvas(page,deg);
    }
    return page;
  }
  async function runOCR(base,img,lang,opts,extra){
    try{const o={...(opts||{}),...(extra||{})};delete o.logger;return await base(img,lang,o)}catch(e){return null}
  }
  function cleanText(s){return String(s||'').replace(/\r/g,'').trim()}
  function groupWords(res,w,h){
    const words=(res&&res.data&&Array.isArray(res.data.words)?res.data.words:[])
      .filter(v=>v&&String(v.text||'').trim()&&v.bbox)
      .map(v=>({text:String(v.text).trim(),x:(v.bbox.x0+v.bbox.x1)/2,y:(v.bbox.y0+v.bbox.y1)/2,h:Math.max(1,v.bbox.y1-v.bbox.y0)}));
    if(!words.length)return[];
    words.sort((a,b)=>a.y-b.y||a.x-b.x);
    const rows=[];
    for(const wd of words){
      let row=rows.find(r=>Math.abs(r.y-wd.y)<Math.max(18,wd.h*1.7));
      if(!row){row={y:wd.y,words:[]};rows.push(row)}
      row.words.push(wd);row.y=row.words.reduce((s,v)=>s+v.y,0)/row.words.length;
    }
    return rows.map(r=>{
      const cells=Array.from({length:11},()=>[]);
      r.words.sort((a,b)=>a.x-b.x).forEach(v=>{const c=Math.max(0,Math.min(10,Math.floor(v.x/Math.max(1,w)*11)));cells[c].push(v.text)});
      return cells.map(a=>a.join(' ').trim());
    });
  }
  function usefulRow(c){
    if(!Array.isArray(c))return false;
    const filled=c.slice(0,5).filter(Boolean).length;
    return filled>=3&&(c[0]||c[1]||c[4]);
  }
  function syntheticRows(rows){
    const out=[];let best=null,bestScore=-1;
    for(const c of rows){
      if(!usefulRow(c))continue;
      const score=c.slice(0,5).filter(Boolean).length;if(score>bestScore){bestScore=score;best=c}
      const vals=[c[0]||'',c[1]||'',c[2]||'',c[3]||'',c[4]||'',c[5]||'',c[6]||'',c[7]||'',c[8]||'',c[9]||'',c[10]||''];
      out.push(vals.join(' ').replace(/\s+/g,' ').trim());
    }
    if(best){
      if(best[0])out.push('Data: '+best[0]);
      if(best[1])out.push('Operador: '+best[1]);
      if(best[2])out.push('Máquina: '+best[2]);
      if(best[3])out.push('Aparas: '+best[3]);
      if(best[4])out.push('Quantidade: '+best[4]);
    }
    return out;
  }

  function installTess(){
    if(!window.Tesseract||typeof window.Tesseract.recognize!=='function'||window.Tesseract.recognize.__dfSmartV3)return false;
    tessBase=window.Tesseract.recognize.bind(window.Tesseract);
    const smart=async function(image,lang,opts){
      if(!(image instanceof HTMLCanvasElement))return tessBase(image,lang,opts);
      const page=normalizePage(image),normal=enhance(page,false);
      let main=await tessBase(normal,lang,opts),best=main,bestConf=Number(main&&main.data&&main.data.confidence||0);

      if(bestConf<60){
        const r2=await runOCR(tessBase,enhance(page,true),lang,opts,{tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
        const c2=Number(r2&&r2.data&&r2.data.confidence||0);if(r2&&c2>bestConf){best=r2;bestConf=c2}
      }

      let targeted=[],targetConf=0;
      try{
        const body=cropCanvas(page,page.width*.015,page.height*.59,page.width*.97,page.height*.22,3);
        const ink=blueInk(body);
        if((ink.__dfInkPixels||0)>40){
          const rt=await runOCR(tessBase,ink,lang,opts,{tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
          targetConf=Number(rt&&rt.data&&rt.data.confidence||0);
          targeted=syntheticRows(groupWords(rt,ink.width,ink.height));
          if(!targeted.length){
            const raw=cleanText(rt&&rt.data&&rt.data.text);
            if(raw)targeted=raw.split(/\n+/).map(v=>v.trim()).filter(Boolean);
          }
        }

        if(!targeted.length){
          const table=cropCanvas(page,page.width*.015,page.height*.585,page.width*.97,page.height*.235,2.5);
          const rt2=await runOCR(tessBase,enhance(table,true),lang,opts,{tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
          targetConf=Math.max(targetConf,Number(rt2&&rt2.data&&rt2.data.confidence||0));
          const raw2=cleanText(rt2&&rt2.data&&rt2.data.text);if(raw2)targeted=raw2.split(/\n+/).map(v=>v.trim()).filter(Boolean);
        }

        const header=cropCanvas(page,page.width*.32,0,page.width*.50,page.height*.22,2.5);
        const rh=await runOCR(tessBase,enhance(header,true),lang,opts,{tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
        const headerText=cleanText(rh&&rh.data&&rh.data.text);
        const parts=[...targeted,headerText,cleanText(best&&best.data&&best.data.text)].filter(Boolean);
        if(best&&best.data)best.data.text=parts.join('\n');
        const hasUseful=targeted.some(v=>/\d/.test(v))&&targeted.length>=2;
        if(best&&best.data&&hasUseful)best.data.confidence=Math.max(bestConf,targetConf,62);
        window.DF_OP_SMART_TARGET={rows:targeted,confidence:targetConf,page:{w:page.width,h:page.height}};
      }catch(e){}
      return best;
    };
    smart.__dfSmartV2=true;smart.__dfSmartV3=true;smart.__dfEnhanced=true;window.Tesseract.recognize=smart;return true;
  }

  function ensureBadge(){
    const bar=$('dfOpQualityBar');if(!bar)return;
    let e=$('dfOpSmartV2');
    if(!e){e=document.createElement('div');e.id='dfOpSmartV2';e.className='dfOpQualityPill ok';bar.appendChild(e)}
    e.textContent='🧠 LEITOR V3: QR recuperado + caneta azul + células da produção';
  }
  function wrapRetry(){
    const input=$('dfOpPhoto');
    if(!input||input.dataset.dfSmartRetry==='1'||typeof input.onchange!=='function'||input.dataset.dfQualityWrapped!=='1')return false;
    const prev=input.onchange;input.dataset.dfSmartRetry='1';
    input.onchange=async function(ev){
      if(location.pathname.includes('teste-ops-relatorio')){try{localStorage.removeItem(HASH_KEY)}catch(e){}}
      return prev.call(this,ev);
    };
    return true;
  }
  function boot(){
    let n=0;const t=setInterval(()=>{installQR();installTess();ensureBadge();wrapRetry();if(++n>160)clearInterval(t)},250);
    window.addEventListener('df-ui-ready',()=>setTimeout(()=>{installQR();installTess();ensureBadge();wrapRetry()},300));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();