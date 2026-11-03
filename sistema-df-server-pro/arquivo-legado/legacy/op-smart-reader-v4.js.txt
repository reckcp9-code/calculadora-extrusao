(function(){
  'use strict';

  const OPS_KEY='df_formula_ops_auto_v2';
  const REG_KEY='df_op_qr_registry_v1';
  const DB='df_ops_fotos_v2';
  const IS_TEST=/teste-ops-relatorio\.html/i.test(location.pathname);
  let mounted=false,working=false;

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=v=>{let s=String(v||'').replace(/[^0-9,.-]/g,'').replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
  const loadJson=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'')||f}catch(e){return f}};
  const saveJson=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  const today=()=>new Date().toISOString().slice(0,10);

  function status(html,type='warn'){
    const e=$('dfOpStatus');if(!e)return;e.innerHTML=html;e.className='dfOpsStatus '+type;
  }

  function loadScript(src,check){return new Promise((res,rej)=>{if(check())return res();const old=[...document.scripts].find(s=>s.src===src);if(old){const t=setInterval(()=>{if(check()){clearInterval(t);res()}},80);setTimeout(()=>{clearInterval(t);check()?res():rej(new Error('Biblioteca não carregou'))},10000);return}const s=document.createElement('script');s.src=src;s.onload=()=>res();s.onerror=()=>rej(new Error('Falha ao carregar biblioteca'));document.head.appendChild(s)})}
  const ensureQR=()=>loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',()=>!!window.jsQR);
  const ensureTess=()=>loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',()=>!!window.Tesseract);

  function mkCanvas(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
  function rotate(src,deg){deg=((deg%360)+360)%360;if(!deg)return src;const sw=deg===90||deg===270,c=mkCanvas(sw?src.height:src.width,sw?src.width:src.height),x=c.getContext('2d',{willReadFrequently:true});x.save();if(deg===90){x.translate(c.width,0);x.rotate(Math.PI/2)}else if(deg===180){x.translate(c.width,c.height);x.rotate(Math.PI)}else{x.translate(0,c.height);x.rotate(-Math.PI/2)}x.drawImage(src,0,0);x.restore();return c}
  function crop(src,x,y,w,h,scale=1){x=Math.max(0,Math.round(x));y=Math.max(0,Math.round(y));w=Math.max(1,Math.min(src.width-x,Math.round(w)));h=Math.max(1,Math.min(src.height-y,Math.round(h)));const c=mkCanvas(w*scale,h*scale),g=c.getContext('2d',{willReadFrequently:true});g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(src,x,y,w,h,0,0,c.width,c.height);return c}
  function imgData(c){return c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height)}

  async function fileCanvas(file,max=3200){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{const sc=Math.min(1,max/Math.max(img.width,img.height)),c=mkCanvas(img.width*sc,img.height*sc),x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('Foto inválida'))};img.src=u})}

  function paperBox(c){
    try{const d=imgData(c).data,w=c.width,h=c.height,step=Math.max(4,Math.floor(Math.max(w,h)/850));let minX=w,minY=h,maxX=0,maxY=0,n=0;for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],lum=.299*r+.587*g+.114*b,sat=Math.max(r,g,b)-Math.min(r,g,b);if(lum>135&&sat<100){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);n++}}if(!n||maxX-minX<w*.38||maxY-minY<h*.28)return{x:0,y:0,w,h};const p=step*5;return{x:Math.max(0,minX-p),y:Math.max(0,minY-p),w:Math.min(w,maxX+p)-Math.max(0,minX-p),h:Math.min(h,maxY+p)-Math.max(0,minY-p)};}catch(e){return{x:0,y:0,w:c.width,h:c.height}}
  }
  function normalizePaper(src){const b=paperBox(src);let p=crop(src,b.x,b.y,b.w,b.h,Math.min(2.2,3000/Math.max(b.w,b.h)));if(p.height>p.width)p=rotate(p,90);return p}

  function qrOnce(c){try{const d=imgData(c);return window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'})||null}catch(e){return null}}
  function qrCenter(q,w,h){try{const pts=[q.location.topLeftCorner,q.location.topRightCorner,q.location.bottomLeftCorner,q.location.bottomRightCorner];return{x:pts.reduce((a,p)=>a+p.x,0)/4/w,y:pts.reduce((a,p)=>a+p.y,0)/4/h}}catch(e){return{x:.5,y:.5}}}
  function findQrAndOrient(base){
    const candidates=[0,90,180,270].map(deg=>({deg,c:rotate(base,deg)}));let best=null;
    for(const it of candidates){const tries=[it.c,crop(it.c,it.c.width*.25,0,it.c.width*.5,it.c.height*.35,2.3),crop(it.c,it.c.width*.20,0,it.c.width*.60,it.c.height*.48,1.9)];for(const tc of tries){const q=qrOnce(tc);if(!q||!q.data)continue;let pos=qrCenter(q,tc.width,tc.height);const score=Math.abs(pos.x-.5)+Math.abs(pos.y-.16)*2.2+(pos.y>.5?2:0);if(!best||score<best.score)best={qr:String(q.data).trim(),page:it.c,deg:it.deg,score}}}
    }
    if(best)return best;
    return{qr:'',page:base,deg:0,score:99};
  }

  function ensureRegistry(id){if(!/^DFOP-/i.test(id))return null;const reg=loadJson(REG_KEY,{});if(!reg[id]){reg[id]={id,createdAt:new Date().toISOString(),recoveredFromQr:true,expected:{title:'',date:'',totalKg:0,largura:0,micra:0,gm:0,materials:[]}};saveJson(REG_KEY,reg);try{window.dispatchEvent(new CustomEvent('df-op-qr-created',{detail:reg[id]}))}catch(e){}}return reg[id].expected||null}

  function isBlue(r,g,b){return b>65&&b>r*1.10&&b>g*1.04&&(b-Math.min(r,g))>18}
  function rowInkCount(page,row){const d=imgData(page).data,w=page.width,h=page.height,y0=Math.floor(h*(.686+row*.0268)),y1=Math.floor(h*(.713+row*.0268));let n=0;for(let y=y0;y<Math.min(h,y1);y+=2)for(let x=Math.floor(w*.025);x<Math.floor(w*.975);x+=2){const i=(y*w+x)*4;if(isBlue(d[i],d[i+1],d[i+2]))n++}return n}
  function activeRows(page){const a=[];for(let r=0;r<8;r++){const n=rowInkCount(page,r);if(n>16)a.push(r)}return a}

  function cellCanvas(page,row,col){
    const x0=.0214+col*.0870,y0=.686+row*.0268,w=.0870,h=.0268;
    const raw=crop(page,page.width*(x0+.004),page.height*(y0+.002),page.width*(w-.008),page.height*(h-.004),4.2),im=imgData(raw),out=mkCanvas(raw.width,raw.height),g=out.getContext('2d',{willReadFrequently:true}),o=g.createImageData(out.width,out.height);
    let ink=0;for(let i=0;i<im.data.length;i+=4){const r=im.data[i],gg=im.data[i+1],b=im.data[i+2],blue=isBlue(r,gg,b),v=blue?0:255;if(blue)ink++;o.data[i]=o.data[i+1]=o.data[i+2]=v;o.data[i+3]=255}g.putImageData(o,0,0);
    if(ink<18)return null;
    const thick=g.getImageData(0,0,out.width,out.height),src=new Uint8ClampedArray(thick.data);for(let y=1;y<out.height-1;y++)for(let x=1;x<out.width-1;x++){const i=(y*out.width+x)*4;if(src[i]<80){for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){const j=((y+yy)*out.width+(x+xx))*4;thick.data[j]=thick.data[j+1]=thick.data[j+2]=0}}}g.putImageData(thick,0,0);return out;
  }

  function cleanDigits(s){return String(s||'').toUpperCase().replace(/[OQ]/g,'0').replace(/[IL|]/g,'1').replace(/S/g,'5').replace(/[^0-9,.:/\-]/g,'').trim()}
  function cleanName(s){return String(s||'').replace(/[^A-Za-zÀ-ÿ .'-]/g,' ').replace(/\s+/g,' ').trim()}
  function parseDateText(s){const m=cleanDigits(s).match(/(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?/);if(!m)return'';let y=m[3]||String(new Date().getFullYear());if(y.length===2)y='20'+y;return y+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0')}
  async function ocrCell(worker,c,col){if(!c)return'';const numeric=[0,2,3,4,5,6,7,8,9,10].includes(col);const whitelist=col===1?'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç .-':col===0?'0123456789/.-':col>=6&&col<=9?'0123456789:.-':'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz,.-';try{await worker.setParameters({tessedit_pageseg_mode:'7',preserve_interword_spaces:'1',tessedit_char_whitelist:whitelist,user_defined_dpi:'300'});const r=await worker.recognize(c);let t=String(r?.data?.text||'').replace(/\s+/g,' ').trim();return numeric?cleanDigits(t):cleanName(t)}catch(e){return''}}

  async function readRows(page){
    await ensureTess();const rows=activeRows(page);if(!rows.length)return[];
    const worker=await window.Tesseract.createWorker('por',1,{logger:m=>{if(m.status==='recognizing text'&&Number.isFinite(m.progress))status('🧠 Lendo os quadrinhos preenchidos... <b>'+Math.round(m.progress*100)+'%</b>','warn')}});const out=[];
    try{for(const r of rows.slice(0,6)){const vals=[];for(let c=0;c<11;c++)vals[c]=await ocrCell(worker,cellCanvas(page,r,c),c);const rec={row:r+1,data:parseDateText(vals[0]),operador:cleanName(vals[1]),maquina:String(vals[2]||'').replace(/[^A-Za-z0-9.-]/g,''),apara:num(vals[3]),produzido:num(vals[4]),codParada:vals[5]||'',inicioParada:vals[6]||'',finalParada:vals[7]||'',inicioProducao:vals[8]||'',finalProducao:vals[9]||'',bobinas:num(vals[10]),raw:vals};if(rec.data||rec.operador||rec.maquina||rec.apara||rec.produzido||rec.bobinas)out.push(rec)}}finally{try{await worker.terminate()}catch(e){}}
    return out;
  }

  function dbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
  async function photoPut(id,blob,meta){const d=await dbOpen();return new Promise((res,rej)=>{const tx=d.transaction('photos','readwrite');tx.objectStore('photos').put({id,blob,mime:blob.type||'image/jpeg',savedAt:new Date().toISOString(),...(meta||{})});tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}

  function buildMaterials(exp,kg){return (exp?.materials||[]).map(m=>({name:m.name,pct:+m.pct||0,kg:kg>0?kg*(+m.pct||0)/100:0}))}
  function triggerRender(){try{const m=$('dfOpMonth');if(m&&typeof m.onchange==='function')m.onchange()}catch(e){}}

  async function process(file){
    if(working)return;working=true;
    try{
      const preview=$('dfOpPreview');if(preview){preview.src=URL.createObjectURL(file);preview.style.display='block'}
      status('📷 Foto recebida. Ajustando a folha e procurando o QR...','warn');
      await ensureQR();const raw=await fileCanvas(file,3300),paper=normalizePaper(raw),found=findQrAndOrient(paper),qr=found.qr,page=found.page;
      if(!qr||!/^DFOP-/i.test(qr)){await photoPut('SEMQR-'+Date.now(),file,{qr:'',month:today().slice(0,7)});status('⚠️ Não consegui identificar o QR. A foto foi guardada, mas não vou inventar nenhum dado.','warn');return}
      const exp=ensureRegistry(qr)||{};
      const existing=loadJson(OPS_KEY,[]).find(o=>o&&(o.id===qr||o.qr===qr));if(existing&&existing.status==='ok'&&!IS_TEST){status('🔒 Essa OP já está concluída. Não será lançada duas vezes.','warn');return}
      await photoPut(qr,file,{qr,month:today().slice(0,7)});
      status('✅ QR identificado: <b>'+esc(qr)+'</b><br>🧠 Agora lendo somente os quadrinhos escritos à mão...','warn');
      const rows=await readRows(page),prod=rows.reduce((s,r)=>s+(r.produzido||0),0),ap=rows.reduce((s,r)=>s+(r.apara||0),0),bob=rows.reduce((s,r)=>s+(r.bobinas||0),0),ops=[...new Set(rows.map(r=>r.operador).filter(Boolean))],maqs=[...new Set(rows.map(r=>r.maquina).filter(Boolean))],dates=rows.map(r=>r.data).filter(Boolean),reasons=[];
      if(!rows.length)reasons.push('nenhuma linha preenchida foi reconhecida');if(!(prod>0))reasons.push('quantidade produzida não foi lida');if(!dates.length)reasons.push('data não foi lida');if(!ops.length)reasons.push('operador não foi lido');if(!maqs.length)reasons.push('máquina não foi lida');if(ap<0||ap>prod)reasons.push('apara fora do limite');if(+exp.totalKg>0&&prod>+exp.totalKg*1.35)reasons.push('produção acima do previsto');
      const rec={id:qr,qr,createdAt:new Date().toISOString(),data:dates[0]||today(),numero:'',operador:ops.join(' / '),maquina:maqs.join(' / '),produto:exp.title||'',largura:+exp.largura||0,micra:+exp.micra||0,gm:+exp.gm||0,produzido:prod,apara:ap,bobinas:bob,rows,materials:buildMaterials(exp,prod),expectedTotal:+exp.totalKg||0,ocrConfidence:reasons.length?72:96,status:reasons.length?'pending':'ok',reasons,reader:'V4-cell'};
      const list=loadJson(OPS_KEY,[]),i=list.findIndex(o=>o.id===qr);if(i>=0)list[i]=rec;else list.unshift(rec);saveJson(OPS_KEY,list);triggerRender();
      if(reasons.length)status('⚠️ OP identificada pelo QR, mas ficou em <b>PENDENTES</b> somente por: '+esc(reasons.join('; '))+'.','warn');else status('✅ <b>OP LIDA E SALVA.</b><br>Linhas: '+rows.length+' • Produção: '+prod.toLocaleString('pt-BR')+' kg • Apara: '+ap.toLocaleString('pt-BR')+' kg • Operador: '+esc(rec.operador),'ok');
    }catch(e){status('❌ Falha na leitura V4: '+esc(e.message||e),'bad')}finally{working=false;try{const i=$('dfOpPhoto');if(i)i.value=''}catch(e){}}
  }

  function mount(){
    const input=$('dfOpPhoto');if(!input)return false;
    input.onchange=e=>{const f=e.target.files?.[0];if(f)process(f)};
    input.dataset.dfReader='v4';
    const btn=$('dfOpTakePhoto');if(btn){btn.textContent='📷 TIRAR FOTO DE LADO';btn.setAttribute('aria-label','Tirar foto com o celular deitado')}
    const bar=$('dfOpQualityBar');if(bar){$('dfOpSmartV2')?.remove();$('dfOpSmartV3')?.remove();if(!$('dfOpSmartV4')){const e=document.createElement('div');e.id='dfOpSmartV4';e.className='dfOpQualityPill ok';e.textContent='🧠 LEITOR V4: QR + PAISAGEM + CÉLULA POR CÉLULA';bar.appendChild(e)}}
    const wrap=$('dfOpPhotoSource');if(wrap&&!$('dfOpLandscapeHintV4')){const h=document.createElement('div');h.id='dfOpLandscapeHintV4';h.textContent='↔️ Tire a foto com o celular DEITADO, pegando a folha inteira. O app gira e recorta sozinho.';h.style.cssText='grid-column:1/-1;border:1px dashed #f5a000;border-radius:11px;padding:9px;color:#fde68a;background:#1b1305;font-size:11px;font-weight:900;line-height:1.4';wrap.appendChild(h)}
    mounted=true;return true;
  }

  function boot(){let n=0;const t=setInterval(()=>{if(mount()&&++n>20)clearInterval(t);if(++n>180)clearInterval(t)},180);window.addEventListener('df-ui-ready',()=>setTimeout(mount,150))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
