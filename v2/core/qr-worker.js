/* QR decoding off the UI thread; no server writes. */
let loaded=false;
self.onmessage=async({data})=>{
 const {id,file}=data;let bitmap;
 try{
 if(!loaded){importScripts('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js');loaded=true}
 bitmap=await createImageBitmap(file);
 const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));
 const base=new OffscreenCanvas(Math.max(1,Math.round(bitmap.width*scale)),Math.max(1,Math.round(bitmap.height*scale)));
 base.getContext('2d').drawImage(bitmap,0,0,base.width,base.height);
 function scan(src,x,y,w,h,f=1){const c=new OffscreenCanvas(Math.max(1,Math.round(w*f)),Math.max(1,Math.round(h*f)));const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(src,x,y,w,h,0,0,c.width,c.height);const d=ctx.getImageData(0,0,c.width,c.height);return self.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'})?.data||''}
 const w=base.width,h=base.height;
 let raw=scan(base,0,0,w,h,Math.min(1,1100/Math.max(w,h)));
 if(!raw)for(const [x,y] of [[.5,0],[0,0],[.5,.5],[0,.5]]){raw=scan(base,w*x,h*y,w/2,h/2)||scan(base,w*x,h*y,w/2,h/2,2);if(raw)break}
 if(!raw)raw=scan(base,0,0,w,h);
 self.postMessage({id,raw});
 }catch(e){self.postMessage({id,error:String(e.message||e)})}finally{bitmap?.close()}
};