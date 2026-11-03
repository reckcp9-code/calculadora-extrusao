(function(){
  'use strict';

  const REG_KEY='df_op_qr_registry_v1';
  const HASH_KEY='df_op_photo_hashes_v1';
  let qrWrapped=false,tessWrapped=false;

  const $=id=>document.getElementById(id);
  function loadJson(k,f){try{return JSON.parse(localStorage.getItem(k)||'')||f}catch(e){return f}}
  function saveJson(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

  function validOpId(v){return /^DFOP-[A-Z0-9-]{8,}$/i.test(String(v||'').trim())}
  function ensureRegistry(id){
    id=String(id||'').trim();
    if(!validOpId(id))return false;
    const reg=loadJson(REG_KEY,{});
    if(!reg[id]){
      reg[id]={id,createdAt:new Date().toISOString(),recoveredFromQr:true,expected:{title:'',date:'',totalKg:0,largura:0,micra:0,gm:0,materials:[]}};
      saveJson(REG_KEY,reg);
      try{window.dispatchEvent(new CustomEvent('df-op-qr-created',{detail:reg[id]}))}catch(e){}
    }
    return true;
  }

  function mkCanvas(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
  function rotate(src,deg){
    deg=((deg%360)+360)%360;if(!deg)return src;
    const swap=deg===90||deg===270,c=mkCanvas(swap?src.height:src.width,swap?src.width:src.height),x=c.getContext('2d',{willReadFrequently:true});
    x.save();
    if(deg===90){x.translate(c.width,0);x.rotate(Math.PI/2)}
    else if(deg===180){x.translate(c.width,c.height);x.rotate(Math.PI)}
    else if(deg===270){x.translate(0,c.height);x.rotate(-Math.PI/2)}
    x.drawImage(src,0,0);x.restore();return c;
  }
  function crop(src,x0,y0,w,h,scale){
    x0=Math.max(0,Math.round(x0));y0=Math.max(0,Math.round(y0));w=Math.max(1,Math.min(src.width-x0,Math.round(w)));h=Math.max(1,Math.min(src.height-y0,Math.round(h)));
    scale=Math.max(.5,Math.min(4,scale||1));const c=mkCanvas(w*scale,h*scale),x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(src,x0,y0,w,h,0,0,c.width,c.height);return c;
  }
  function dataOf(c){return c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height)}

  function paperBox(src){
    try{
      const w=src.width,h=src.height,d=dataOf(src).data,step=Math.max(4,Math.floor(Math.max(w,h)/700));
      let minX=w,minY=h,maxX=0,maxY=0,n=0;
      for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],lum=.299*r+.587*g+.114*b;if(lum>145&&Math.max(r,g,b)-Math.min(r,g,b)<85){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);n++}}
      if(!n||maxX-minX<w*.35||maxY-minY<h*.28)return{x:0,y:0,w,h};
      const p=step*4;return{x:Math.max(0,minX-p),y:Math.max(0,minY-p),w:Math.min(w,maxX+p)-Math.max(0,minX-p),h:Math.min(h,maxY+p)-Math.max(0,minY-p)};
    }catch(e){return{x:0,y:0,w:src.width,h:src.height}}
  }
  function normalizeLandscape(src){
    const b=paperBox(src);let p=crop(src,b.x,b.y,b.w,b.h,Math.min(2.2,2500/Math.max(b.w,b.h)));
    if(p.height>p.width)p=rotate(p,90);
    return p;
  }

  function qrCall(fn,c){try{const d=dataOf(c);return fn(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'})||null}catch(e){return null}}
  function qrSearch(fn,src){
    const base=normalizeLandscape(src),rots=[base,rotate(base,180),rotate(base,90),rotate(base,270)];
    for(const r of rots){
      let q=qrCall(fn,r);if(q&&q.data)return q;
      const zones=[
        [0,0,r.width*.55,r.height*.48],[r.width*.28,0,r.width*.55,r.height*.48],[r.width*.45,0,r.width*.55,r.height*.48],
        [0,r.height*.18,r.width*.55,r.height*.5],[r.width*.3,r.height*.12,r.width*.55,r.height*.5]
      ];
      for(const z of zones){const c=crop(r,z[0],z[1],z[2],z[3],Math.min(4,1700/Math.max(z[2],z[3])));q=qrCall(fn,c);if(q&&q.data)return q}
    }
    return null;
  }

  function wrapQR(){
    const cur=window.jsQR;if(!cur||qrWrapped||cur.__dfSmartV3)return false;
    const base=cur;
    const smart=function(data,w,h,opts){
      let r=null;try{r=base(data,w,h,opts)}catch(e){}
      if(r&&r.data){ensureRegistry(r.data);return r}
      try{const c=mkCanvas(w,h),x=c.getContext('2d',{willReadFrequently:true});x.putImageData(new ImageData(new Uint8ClampedArray(data),w,h),0,0);r=qrSearch(base,c);if(r&&r.data)ensureRegistry(r.data);return r}catch(e){return null}
    };
    smart.__dfEnhanced=true;smart.__dfSmartV3=true;window.jsQR=smart;qrWrapped=true;return true;
  }

  function blueMaskRow(page){
    try{
      const d=dataOf(page),w=d.width,h=d.height,a=d.data,row=new Float64Array(h);
      for(let y=Math.floor(h*.48);y<Math.floor(h*.96);y++){
        let n=0;for(let x=0;x<w;x+=2){const i=(y*w+x)*4,r=a[i],g=a[i+1],b=a[i+2];if(b>70&&b>r*1.15&&b>g*1.08&&(b-Math.min(r,g))>24)n++}row[y]=n;
      }
      let py=0,best=0;for(let y=0;y<h;y++)if(row[y]>best){best=row[y];py=y}
      if(best<8)return null;
      const rh=Math.max(28,Math.round(h*.075)),y0=Math.max(0,py-Math.round(rh*.55));
      const stripe=crop(page,0,y0,w,Math.min(rh,h-y0),2.2),im=dataOf(stripe),o=mkCanvas(stripe.width,stripe.height),ox=o.getContext('2d',{willReadFrequently:true}),od=ox.createImageData(stripe.width,stripe.height);
      for(let i=0;i<im.data.length;i+=4){const r=im.data[i],g=im.data[i+1],b=im.data[i+2],blue=b>65&&b>r*1.12&&b>g*1.06&&(b-Math.min(r,g))>20,v=blue?0:255;od.data[i]=od.data[i+1]=od.data[i+2]=v;od.data[i+3]=255}
      ox.putImageData(od,0,0);return o;
    }catch(e){return null}
  }

  function usefulText(t){return String(t||'').replace(/\s+/g,' ').trim()}
  function pageScore(text){const t=String(text||'').toUpperCase();let s=0;['FERREIRA','ORDEM','PRODUCAO','MATERIAL','OPERADOR','MAQUINA','QUANTIDADE','APARAS'].forEach(k=>{if(t.includes(k))s+=10});return s}

  function wrapTess(){
    if(!window.Tesseract||typeof window.Tesseract.recognize!=='function'||tessWrapped||window.Tesseract.recognize.__dfSmartV3)return false;
    const base=window.Tesseract.recognize.bind(window.Tesseract);
    const smart=async function(image,lang,opts){
      if(!(image instanceof HTMLCanvasElement))return base(image,lang,opts);
      const page=normalizeLandscape(image),a=page,b=rotate(page,180);
      let r1=await base(a,lang,opts),best=r1;
      const t1=usefulText(r1&&r1.data&&r1.data.text),c1=Number(r1&&r1.data&&r1.data.confidence||0);
      if(pageScore(t1)<20){
        try{const o={...(opts||{})};delete o.logger;const r2=await base(b,lang,o),t2=usefulText(r2&&r2.data&&r2.data.text),c2=Number(r2&&r2.data&&r2.data.confidence||0);if(pageScore(t2)>pageScore(t1)||c2>c1+8)best=r2}catch(e){}
      }
      try{
        const row=blueMaskRow(best===r1?a:b);
        if(row){
          const o={...(opts||{}),tessedit_pageseg_mode:'7',preserve_interword_spaces:'1'};delete o.logger;
          const rr=await base(row,lang,o),txt=usefulText(rr&&rr.data&&rr.data.text);
          if(txt&&best&&best.data){best.data.text=String(best.data.text||'')+'\n'+txt;best.data.confidence=Math.max(Number(best.data.confidence||0),Number(rr&&rr.data&&rr.data.confidence||0))}
        }
      }catch(e){}
      return best;
    };
    smart.__dfEnhanced=true;smart.__dfSmartV3=true;window.Tesseract.recognize=smart;tessWrapped=true;return true;
  }

  function cameraUx(){
    const btn=$('dfOpTakePhoto');if(btn){btn.textContent='📷 TIRAR FOTO DE LADO';btn.setAttribute('aria-label','Tirar foto com o celular deitado')}
    const wrap=$('dfOpPhotoSource');
    if(wrap&&!$('dfOpLandscapeHint')){const h=document.createElement('div');h.id='dfOpLandscapeHint';h.textContent='↔️ Para melhor leitura, tire a foto com o celular DEITADO e pegue a folha inteira.';h.style.cssText='grid-column:1/-1;border:1px dashed #f5a000;border-radius:11px;padding:9px 10px;color:#fde68a;background:#1b1305;font-size:11px;font-weight:850;line-height:1.4';wrap.appendChild(h)}
  }

  function badge(){
    const old=$('dfOpSmartV2');if(old)old.remove();
    const bar=$('dfOpQualityBar');if(!bar||$('dfOpSmartV3'))return;
    const e=document.createElement('div');e.id='dfOpSmartV3';e.className='dfOpQualityPill ok';e.textContent='🧠 LEITOR V3: QR recuperado + foto de lado + caneta azul';bar.appendChild(e);
  }

  function clearTestDuplicate(){
    if(/teste-ops-relatorio\.html/i.test(location.pathname)){try{localStorage.removeItem(HASH_KEY)}catch(e){}}
  }

  function boot(){
    clearTestDuplicate();let n=0;const t=setInterval(()=>{wrapQR();wrapTess();cameraUx();badge();if(++n>160)clearInterval(t)},200);
    window.addEventListener('df-ui-ready',()=>setTimeout(()=>{wrapQR();wrapTess();cameraUx();badge()},120));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
