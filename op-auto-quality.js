(function(){
  'use strict';

  const OPS_KEY='df_formula_ops_auto_v2';
  const REG_KEY='df_op_qr_registry_v1';
  const HASH_KEY='df_op_photo_hashes_v1';
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  let qrNative=null,tessNative=null,syncBusy=false,lastCloudHash='';

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function loadJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch(e){return fallback}}
  function saveJson(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}}
  function quickHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}

  function addStyle(){
    if($('dfOpQualityStyle'))return;
    const s=document.createElement('style');s.id='dfOpQualityStyle';s.textContent=`
      #dfOpQualityBar{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:10px 0 0}
      .dfOpQualityPill{border:1px solid #334155;background:#0f172a;border-radius:11px;padding:8px 9px;font-size:10px;font-weight:900;line-height:1.35;color:#cbd5e1}
      .dfOpQualityPill.ok{border-color:#166534;color:#86efac}.dfOpQualityPill.warn{border-color:#a16207;color:#fde68a}.dfOpQualityPill.bad{border-color:#7f1d1d;color:#fca5a5}
      @media(max-width:420px){#dfOpQualityBar{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function ensureBar(){
    addStyle();
    const hero=document.querySelector('#dfFormulaOps .dfOpsHero');
    if(!hero||$('dfOpQualityBar'))return false;
    const bar=document.createElement('div');bar.id='dfOpQualityBar';bar.innerHTML='<div id="dfOpQualityRead" class="dfOpQualityPill ok">✨ FOTO: correção automática ativa</div><div id="dfOpQualityDup" class="dfOpQualityPill ok">🔒 DUPLICIDADE: bloqueada</div><div id="dfOpQualityCloud" class="dfOpQualityPill warn">☁️ DADOS: preparando nuvem</div><div id="dfOpQualityPhoto" class="dfOpQualityPill warn">📷 FOTO: salva no aparelho</div>';
    hero.appendChild(bar);return true;
  }

  function setPill(id,text,type){const e=$(id);if(!e)return;e.textContent=text;e.className='dfOpQualityPill '+(type||'')}
  function setMainStatus(html,type){const e=$('dfOpStatus');if(!e)return;e.innerHTML=html;e.className='dfOpsStatus '+(type||'')}

  function loadScript(src,check){return new Promise((resolve,reject)=>{if(check())return resolve();const old=[...document.scripts].find(s=>s.src===src);if(old){const t=setInterval(()=>{if(check()){clearInterval(t);resolve()}},80);setTimeout(()=>{clearInterval(t);check()?resolve():reject(new Error('Biblioteca não carregou'))},8000);return}const s=document.createElement('script');s.src=src;s.onload=()=>resolve();s.onerror=()=>reject(new Error('Falha ao carregar biblioteca'));document.head.appendChild(s)})}

  function thresholdVariant(data,w,h,threshold,contrast){
    const out=new Uint8ClampedArray(data.length);contrast=contrast||1.35;
    for(let i=0;i<data.length;i+=4){
      const y=.299*data[i]+.587*data[i+1]+.114*data[i+2];
      let v=(y-128)*contrast+128;
      if(threshold!==null&&threshold!==undefined)v=v<threshold?0:255;
      else v=Math.max(0,Math.min(255,v));
      out[i]=out[i+1]=out[i+2]=v;out[i+3]=255;
    }
    return out;
  }

  function cropScale(data,w,h,x0,y0,cw,ch,scale){
    x0=Math.max(0,Math.min(w-1,Math.round(x0)));y0=Math.max(0,Math.min(h-1,Math.round(y0)));
    cw=Math.max(1,Math.min(w-x0,Math.round(cw)));ch=Math.max(1,Math.min(h-y0,Math.round(ch)));scale=scale||1;
    const ow=cw*scale,oh=ch*scale,out=new Uint8ClampedArray(ow*oh*4);
    for(let y=0;y<oh;y++){
      const sy=y0+Math.min(ch-1,Math.floor(y/scale));
      for(let x=0;x<ow;x++){
        const sx=x0+Math.min(cw-1,Math.floor(x/scale)),si=(sy*w+sx)*4,di=(y*ow+x)*4;
        out[di]=data[si];out[di+1]=data[si+1];out[di+2]=data[si+2];out[di+3]=255;
      }
    }
    return{data:out,width:ow,height:oh};
  }

  function wrapQR(){
    if(!window.jsQR||window.jsQR.__dfEnhanced)return;
    qrNative=window.jsQR;
    const wrapped=function(data,w,h,opts){
      let r=null;
      try{r=qrNative(data,w,h,opts);if(r)return r}catch(e){}
      const tries=[];
      try{tries.push({data:thresholdVariant(data,w,h,null,1.55),width:w,height:h})}catch(e){}
      try{tries.push({data:thresholdVariant(data,w,h,150,1),width:w,height:h})}catch(e){}
      try{tries.push(cropScale(data,w,h,w*.12,0,w*.76,h*.58,2))}catch(e){}
      try{tries.push(cropScale(data,w,h,0,0,w,h*.55,1))}catch(e){}
      for(const t of tries){
        try{
          r=qrNative(t.data,t.width,t.height,{...(opts||{}),inversionAttempts:'attemptBoth'});
          if(r)return r;
          const bw=thresholdVariant(t.data,t.width,t.height,165,1);
          r=qrNative(bw,t.width,t.height,{...(opts||{}),inversionAttempts:'attemptBoth'});
          if(r)return r;
        }catch(e){}
      }
      return null;
    };
    wrapped.__dfEnhanced=true;window.jsQR=wrapped;
  }

  async function ensureQR(){await loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',()=>!!window.jsQR);wrapQR()}

  function detectPaperBox(c){
    const x=c.getContext('2d',{willReadFrequently:true}),w=c.width,h=c.height;
    if(w<300||h<200)return{x:0,y:0,w,h};
    const data=x.getImageData(0,0,w,h).data,step=Math.max(3,Math.floor(Math.max(w,h)/700));
    const rowScores=[];for(let y=0;y<h;y+=step){let bright=0,n=0;for(let xx=0;xx<w;xx+=step){const i=(y*w+xx)*4,lum=.299*data[i]+.587*data[i+1]+.114*data[i+2];if(lum>175)bright++;n++}rowScores.push([y,bright/Math.max(1,n)])}
    const colScores=[];for(let xx=0;xx<w;xx+=step){let bright=0,n=0;for(let y=0;y<h;y+=step){const i=(y*w+xx)*4,lum=.299*data[i]+.587*data[i+1]+.114*data[i+2];if(lum>175)bright++;n++}colScores.push([xx,bright/Math.max(1,n)])}
    const goodR=rowScores.filter(v=>v[1]>.34).map(v=>v[0]),goodC=colScores.filter(v=>v[1]>.34).map(v=>v[0]);
    if(goodR.length<rowScores.length*.28||goodC.length<colScores.length*.28)return{x:0,y:0,w,h};
    let y0=Math.max(0,Math.min(...goodR)-step*2),y1=Math.min(h,Math.max(...goodR)+step*3),x0=Math.max(0,Math.min(...goodC)-step*2),x1=Math.min(w,Math.max(...goodC)+step*3);
    if((x1-x0)<w*.55||(y1-y0)<h*.35)return{x:0,y:0,w,h};
    return{x:x0,y:y0,w:x1-x0,h:y1-y0};
  }

  function enhanceCanvas(input,strong){
    try{
      const box=detectPaperBox(input),max=strong?3000:2600,scale=Math.min(2,max/Math.max(box.w,box.h));
      const out=document.createElement('canvas');out.width=Math.max(1,Math.round(box.w*scale));out.height=Math.max(1,Math.round(box.h*scale));
      const o=out.getContext('2d',{willReadFrequently:true});o.fillStyle='#fff';o.fillRect(0,0,out.width,out.height);o.imageSmoothingEnabled=true;o.imageSmoothingQuality='high';o.drawImage(input,box.x,box.y,box.w,box.h,0,0,out.width,out.height);
      const im=o.getImageData(0,0,out.width,out.height),d=im.data;
      let mean=0,n=0;for(let i=0;i<d.length;i+=Math.max(4,Math.floor(d.length/180000/4)*4||4)){mean+=.299*d[i]+.587*d[i+1]+.114*d[i+2];n++}mean/=Math.max(1,n);
      const contrast=strong?1.75:1.48,offset=(128-mean)*.10;
      for(let i=0;i<d.length;i+=4){let y=.299*d[i]+.587*d[i+1]+.114*d[i+2];y=(y-128)*contrast+128+offset;y=Math.max(0,Math.min(255,y));d[i]=d[i+1]=d[i+2]=y;d[i+3]=255}o.putImageData(im,0,0);return out;
    }catch(e){return input}
  }

  function wrapTesseract(){
    if(!window.Tesseract||!window.Tesseract.recognize||window.Tesseract.recognize.__dfEnhanced)return;
    tessNative=window.Tesseract.recognize.bind(window.Tesseract);
    const wrapped=async function(image,lang,opts){
      if(!(image instanceof HTMLCanvasElement))return tessNative(image,lang,opts);
      const first=enhanceCanvas(image,false);
      let r1=await tessNative(first,lang,opts);
      const c1=Number(r1&&r1.data&&r1.data.confidence||0);
      if(c1>=57)return r1;
      const second=enhanceCanvas(image,true),opts2={...(opts||{})};delete opts2.logger;
      try{
        const r2=await tessNative(second,lang,opts2),c2=Number(r2&&r2.data&&r2.data.confidence||0);
        return c2>c1?r2:r1;
      }catch(e){return r1}
    };
    wrapped.__dfEnhanced=true;window.Tesseract.recognize=wrapped;
  }

  function monitorLibs(){wrapQR();wrapTesseract();const mo=new MutationObserver(()=>{wrapQR();wrapTesseract()});if(document.documentElement)mo.observe(document.documentElement,{childList:true,subtree:true});setInterval(()=>{wrapQR();wrapTesseract()},1200)}

  async function fileCanvas(file,max){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{const sc=Math.min(1,(max||1800)/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('Imagem inválida'))};img.src=u})}
  async function decodeFileQR(file){await ensureQR();const c=await fileCanvas(file,1800),x=c.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,c.width,c.height);return window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'})?.data||''}
  async function fileHash(file){try{const b=await file.arrayBuffer(),h=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(h)).map(v=>v.toString(16).padStart(2,'0')).join('')}catch(e){return quickHash(String(file.name)+':'+file.size+':'+file.lastModified)}}

  function wrapInput(){
    const input=$('dfOpPhoto');if(!input||input.dataset.dfQualityWrapped==='1'||typeof input.onchange!=='function')return false;
    input.dataset.dfQualityWrapped='1';const original=input.onchange;
    input.onchange=async function(ev){
      const file=ev.target&&ev.target.files&&ev.target.files[0];if(!file)return original.call(this,ev);
      setMainStatus('✨ Melhorando a leitura da foto e conferindo duplicidade...','warn');
      const hash=await fileHash(file),hashes=loadJson(HASH_KEY,{});
      if(hashes[hash]){setMainStatus('🔒 <b>Foto duplicada bloqueada.</b><br>Essa mesma imagem já foi enviada antes.','warn');try{input.value=''}catch(e){}return}
      let qr='';try{qr=await decodeFileQR(file)}catch(e){}
      const records=loadJson(OPS_KEY,[]),existing=qr&&records.find(o=>o&&((o.qr&&o.qr===qr)||o.id===qr));
      if(existing&&existing.status==='ok'){
        setMainStatus('🔒 <b>OP duplicada bloqueada.</b><br>O QR <b>'+esc(qr)+'</b> já está concluído e não será contado duas vezes.','warn');try{input.value=''}catch(e){}return
      }
      await original.call(this,ev);
      const st=$('dfOpStatus');if(!st||!/❌/.test(st.textContent||'')){hashes[hash]={at:new Date().toISOString(),qr:qr||''};const keys=Object.keys(hashes).sort((a,b)=>String(hashes[b]?.at||'').localeCompare(String(hashes[a]?.at||'')));keys.slice(300).forEach(k=>delete hashes[k]);saveJson(HASH_KEY,hashes);scheduleCloudSync()}
    };
    return true;
  }

  function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}return String(localStorage.getItem(DEVICE_KEY)||'').trim()}
  function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function unb64(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))}
  function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}

  async function renewSession(force){
    let token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim();let p=tokenPayload(token);if(token&&!force&&p&&p.owner)return token;
    const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim(),dev=deviceId();if(!credential||!dev)throw new Error('sem acesso automático');
    const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');token=String(j.token||'').trim();if(!token)throw new Error('sessão vazia');sessionStorage.setItem(TOKEN_KEY,token);return token;
  }
  async function apiPost(path,body,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}if(!r.ok||j.ok===false){const e=new Error(j.error||('HTTP '+r.status));e.status=r.status;throw e}return j}
  async function deriveKey(owner){const raw=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('DF-EXTRUSOR-BACKUP-v2|'+owner));return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt'])}
  async function decrypt(env,owner){if(!env||env.alg!=='A256GCM')throw new Error('backup inválido');const key=await deriveKey(owner),plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(env.iv)},key,unb64(env.ct));return JSON.parse(new TextDecoder().decode(plain))}
  async function encrypt(data,owner){const key=await deriveKey(owner),iv=crypto.getRandomValues(new Uint8Array(12)),plain=new TextEncoder().encode(JSON.stringify(data)),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plain);return{v:2,alg:'A256GCM',kdf:'owner-v1',iv:b64(iv),ct:b64(new Uint8Array(ct))}}

  function cloudHash(){return quickHash(String(localStorage.getItem(OPS_KEY)||'')+'|'+String(localStorage.getItem(REG_KEY)||''))}
  let syncTimer=null;
  function scheduleCloudSync(){clearTimeout(syncTimer);syncTimer=setTimeout(syncOpsToCloud,2200)}
  async function syncOpsToCloud(){
    if(syncBusy||navigator.onLine===false)return false;
    const access=String(localStorage.getItem(ACCESS_KEY)||'').trim();if(!access){setPill('dfOpQualityCloud','☁️ DADOS: aguardando acesso','warn');return false}
    const h=cloudHash();if(h===lastCloudHash)return true;syncBusy=true;setPill('dfOpQualityCloud','☁️ DADOS: sincronizando...','warn');
    try{
      const token=await renewSession(false),owner=String(tokenPayload(token)?.owner||'').trim();if(!owner)throw new Error('sem proprietário');
      const loaded=await apiPost('/backup/load',{});let snap={v:2,createdAt:new Date().toISOString(),origin:location.origin,data:{}};
      if(loaded.backup){try{snap=await decrypt(loaded.backup,owner)}catch(e){}}
      if(!snap||typeof snap!=='object')snap={};if(!snap.data||typeof snap.data!=='object')snap.data={};
      const ops=localStorage.getItem(OPS_KEY),reg=localStorage.getItem(REG_KEY);if(ops!==null)snap.data[OPS_KEY]=ops;if(reg!==null)snap.data[REG_KEY]=reg;
      snap.v=Math.max(2,Number(snap.v)||2);snap.createdAt=new Date().toISOString();snap.origin=location.origin;snap.opSyncVersion=1;
      const envelope=await encrypt(snap,owner);await apiPost('/backup/save',{backup:envelope,clientTime:snap.createdAt});lastCloudHash=h;setPill('dfOpQualityCloud','☁️ DADOS: sincronizados','ok');return true;
    }catch(e){setPill('dfOpQualityCloud','☁️ DADOS: fila local','warn');return false}finally{syncBusy=false}
  }

  async function restoreOpsIfEmpty(){
    try{
      const local=loadJson(OPS_KEY,[]);if(local.length||navigator.onLine===false||!localStorage.getItem(ACCESS_KEY))return;
      const token=await renewSession(false),owner=String(tokenPayload(token)?.owner||'').trim();if(!owner)return;const loaded=await apiPost('/backup/load',{});if(!loaded.backup)return;const snap=await decrypt(loaded.backup,owner);const ops=snap?.data?.[OPS_KEY],reg=snap?.data?.[REG_KEY];if(ops){localStorage.setItem(OPS_KEY,String(ops));if(reg)localStorage.setItem(REG_KEY,String(reg));setPill('dfOpQualityCloud','☁️ DADOS: restaurados da nuvem','ok');setTimeout(()=>window.dispatchEvent(new CustomEvent('df-ui-ready')),80)}
    }catch(e){}
  }

  function boot(){
    monitorLibs();ensureBar();let n=0;const t=setInterval(()=>{ensureBar();wrapInput();if(++n>30)clearInterval(t)},200);setTimeout(()=>{wrapInput();restoreOpsIfEmpty();scheduleCloudSync()},1200);
    window.addEventListener('df-op-qr-created',scheduleCloudSync);window.addEventListener('online',scheduleCloudSync);
    setInterval(()=>{const h=cloudHash();if(h!==lastCloudHash)scheduleCloudSync()},12000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('df-ui-ready',()=>setTimeout(()=>{ensureBar();wrapInput()},180));
})();
