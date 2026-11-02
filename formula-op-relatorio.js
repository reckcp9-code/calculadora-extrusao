(function(){
  'use strict';
  const KEY='df_formula_ops_auto_v2';
  const REG_KEY='df_op_qr_registry_v1';
  const DB='df_ops_fotos_v2';
  let selectedFile=null,working=false,stream=null,scanTimer=null;

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function num(v){return typeof window.DFParsePtNumber==='function'?window.DFParsePtNumber(v):0}
  const fmt=(v,d=2)=>Number.isFinite(+v)?(+v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
  const today=()=>new Date().toISOString().slice(0,10), monthNow=()=>today().slice(0,7);
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function save(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}renderAll()}
  function registry(){try{return JSON.parse(localStorage.getItem(REG_KEY)||'{}')}catch(e){return{}}}
  // Somente leitura: nenhum dado de produção ou fechamento é regravado.
  let originalProducts={};
  const normId=v=>String(v??'').trim().toUpperCase().replace(/\s+/g,'');
  const realName=v=>{const name=String(v??'').trim();return name&&!/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(name)?name:''};
  function opIds(o){return [o?.id,o?.qr,o?.numero,o?.op,o?.codigo].map(normId).filter(Boolean)}
  function originalEntry(o){
    const ids=opIds(o),r=registry();
    for(const [key,entry] of Object.entries(r)){
      if(ids.includes(normId(entry?.id||key)))return entry;
    }
    return null;
  }
  function linkedProduction(o){
    const ids=opIds(o);if(!ids.length)return[];
    const matches=[];
    for(const key of ['df_production_now_team_v1','df_production_now_team_test_v6','df_production_now_v1']){
      let list=[];try{list=JSON.parse(localStorage.getItem(key)||'[]')}catch(e){}
      if(!Array.isArray(list))continue;
      matches.push(...list.filter(x=>[x?.op,x?.id,x?.qr,x?.opId].some(v=>ids.includes(normId(v)))));
    }
    return matches;
  }
  function productFor(o){
    let name=realName(o?.produto);if(name)return name;
    const original=originalEntry(o),ids=opIds(o);
    name=realName(original?.expected?.title)||realName(original?.expected?.produto)||realName(original?.produto);
    if(name)return name;
    for(const id of ids){
      const expected=originalProducts[id];
      name=realName(expected?.title)||realName(expected?.produto)||realName(expected?.product);
      if(name)return name;
    }
    for(const x of linkedProduction(o)){
      name=realName(x?.product)||realName(x?.produto)||realName(x?.nomeProduto)||realName(x?.opNome);
      if(name)return name;
    }
    return realName(o?.product)||realName(o?.nomeProduto)||realName(o?.opNome)||realName(o?.expected?.title)||realName(o?.title)||'Produto não informado';
  }
  async function readOriginalProducts(){
    try{
      const api=window.DFOpRegistryCloudTestV174;
      if(typeof api?.readOriginalProducts!=='function')return;
      originalProducts=await api.readOriginalProducts($('dfOpMonth')?.value||monthNow());
    }catch(e){}
  }


  function dbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function photoPut(id,blob,meta={}){const d=await dbOpen();return new Promise((res,rej)=>{const tx=d.transaction('photos','readwrite');tx.objectStore('photos').put({id,blob,mime:blob.type||'image/jpeg',savedAt:new Date().toISOString(),...meta});tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
  async function photoGet(id){const d=await dbOpen();return new Promise((res,rej)=>{const r=d.transaction('photos').objectStore('photos').get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
  async function photoDelete(id){const d=await dbOpen();return new Promise((res,rej)=>{const tx=d.transaction('photos','readwrite');tx.objectStore('photos').delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}

  function loadScript(src,check){return new Promise((resolve,reject)=>{if(check())return resolve();const s=document.createElement('script');s.src=src;s.onload=()=>resolve();s.onerror=()=>reject(new Error('Falha ao carregar biblioteca'));document.head.appendChild(s)})}
  const loadQR=()=>loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',()=>!!window.jsQR);
  const loadTess=()=>loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',()=>!!window.Tesseract);
  const loadZip=()=>loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',()=>!!window.JSZip);

  function addStyle(){if($('dfOpsStyle'))return;const s=document.createElement('style');s.id='dfOpsStyle';s.textContent=`
    #dfFormulaSubnav{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 14px}#dfFormulaSubnav button,.dfOpsTabs button{border:1px solid #334155;background:#0f172a;color:#cbd5e1;border-radius:13px;padding:12px 7px;font-weight:950;font-size:11px}#dfFormulaSubnav button.on,.dfOpsTabs button.on{border-color:#f5a000;background:#211400;color:#ffd36a}#dfFormulaOps{display:none}#dfFormulaOps.on{display:block}
    .dfOpsHero{border:1px solid #f5a000;background:linear-gradient(180deg,#211400,#14100a);border-radius:18px;padding:16px;margin-bottom:12px}.dfOpsHero h2{margin:0 0 6px;color:#ffd36a}.dfOpsHero p{margin:0;color:#cbd5e1;line-height:1.45;font-size:13px}.dfOpsTabs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px}.dfOpsPane{display:none}.dfOpsPane.on{display:block}.dfOpsCard{background:#111827;border:1px solid #263244;border-radius:18px;padding:16px;margin-bottom:12px}.dfOpsCard h3{margin:0 0 11px;font-size:18px}.dfOpsBtn{width:100%;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:13px;padding:13px 10px;margin-top:9px;font-size:14px;font-weight:950}.dfOpsBtn.alt{border-color:#f5a000;background:#241600;color:#ffd36a}.dfOpsBtn.gray{border-color:#475569;background:#0f172a;color:#e2e8f0}.dfOpsBtn.danger{border-color:#7f1d1d;background:#230b0b;color:#fca5a5}.dfOpsCard input,.dfOpsCard select{width:100%;border:1px solid #334155;background:#0f172a;color:#fff;border-radius:12px;padding:12px;font-size:16px}.dfOpsTiny{color:#94a3b8;font-size:11px;line-height:1.45}.dfOpsStatus{border:1px solid #334155;background:#0f172a;border-radius:13px;padding:12px;margin-top:10px;font-size:12px;font-weight:800;line-height:1.45}.dfOpsStatus.ok{border-color:#166534;color:#86efac}.dfOpsStatus.warn{border-color:#a16207;color:#fde68a}.dfOpsStatus.bad{border-color:#7f1d1d;color:#fca5a5}#dfOpPreview{display:none;width:100%;max-height:400px;object-fit:contain;border:1px solid #334155;border-radius:14px;background:#080b13;margin-top:10px}.dfOpList{border:1px solid #263244;background:#0f172a;border-radius:14px;padding:12px;margin-top:8px}.dfOpList strong{color:#ffd36a}.dfOpBadge{display:inline-block;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:950;margin-left:5px}.dfOpBadge.ok{background:#0c321c;color:#86efac}.dfOpBadge.warn{background:#3a2605;color:#fde68a}.dfOpKpis{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.dfOpKpi{border:1px solid #263244;background:#0f172a;border-radius:13px;padding:11px}.dfOpKpi span{display:block;color:#94a3b8;font-size:10px}.dfOpKpi b{display:block;font-size:19px;margin-top:4px}.dfOpGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dfOpGrid label{display:block;color:#cbd5e1;font-size:11px;margin:7px 0 4px}.dfOpTable{width:100%;border-collapse:collapse;font-size:11px}.dfOpTable td,.dfOpTable th{padding:6px 4px;border-bottom:1px solid #263244;text-align:left}.dfOpModal{position:fixed;inset:0;z-index:999999;background:#020617eF;display:none;padding:18px;overflow:auto}.dfOpModal.on{display:block}.dfOpModalBox{max-width:720px;margin:20px auto;background:#111827;border:1px solid #334155;border-radius:18px;padding:14px}.dfOpModal img{width:100%;max-height:65vh;object-fit:contain;border-radius:12px;background:#000}.dfScanWrap video{width:100%;border-radius:14px;background:#000;max-height:58vh}.dfPendingReason{color:#fde68a;font-size:11px;margin-top:5px}.dfArchiveBtns{display:grid;grid-template-columns:1fr 1fr;gap:7px}.dfQrDemo{border:1px dashed #f5a000;border-radius:13px;padding:10px;color:#fde68a;font-size:11px;line-height:1.5;margin-top:10px}
    @media(max-width:560px){.dfOpsTabs{grid-template-columns:1fr 1fr 1fr}.dfOpsTabs button{padding:10px 3px;font-size:10px}.dfOpGrid{grid-template-columns:1fr 1fr}.dfArchiveBtns{grid-template-columns:1fr}.dfOpKpi b{font-size:17px}}
  `;document.head.appendChild(s)}

  function build(){return `
    <div class="dfOpsHero"><h2>🤖 OP DE FORMULAÇÃO + QR</h2><p>Ao fotografar a baixa, a OPID e o ID da formulação são vinculados automaticamente. A foto vai para a nuvem de Formulação e fica pendente até o dono conferir e confirmar.</p></div>
    <div class="dfOpsTabs"><button class="on" data-pane="read">📸 LER OP</button><button data-pane="ok">✅ PRONTAS</button><button data-pane="pending">⚠️ PENDENTES</button><button data-pane="month">📊 MÊS</button></div>
    <div id="dfPaneRead" class="dfOpsPane on"><div class="dfOpsCard"><h3>Fotografar OP preenchida</h3><input id="dfOpPhoto" type="file" accept="image/*" capture="environment"><img id="dfOpPreview"><div id="dfOpStatus" class="dfOpsStatus">Escolha ou tire uma foto. Assim que selecionar, a leitura começa sozinha.</div><div class="dfQrDemo">A foto e os dados lidos ficam vinculados ao OPID e à formulação. Toda baixa aguarda a conferência do dono. Depois de confirmada, entra nas prontas e no total do mês.</div></div></div>
    <div id="dfPaneOk" class="dfOpsPane"><div class="dfOpsCard"><h3>OPs processadas automaticamente</h3><div id="dfOkList"></div></div></div>
    <div id="dfPanePending" class="dfOpsPane"><div class="dfOpsCard"><h3>Pendências</h3><div class="dfOpsTiny">No fim do mês, aponte a câmera para o QR da OP física. O sistema abre exatamente a foto arquivada daquela OP.</div><button id="dfScanQr" class="dfOpsBtn alt">📷 APONTAR CÂMERA PARA O QR</button><input id="dfScanQrFile" type="file" accept="image/*" capture="environment" style="margin-top:8px"><div id="dfPendingList"></div></div></div>
    <div id="dfPaneMonth" class="dfOpsPane"><div class="dfOpsCard"><h3>Fechamento automático</h3><label>Mês</label><input id="dfOpMonth" type="month"><div id="dfReport"></div><button id="dfPrintReport" class="dfOpsBtn alt">📄 GERAR RELATÓRIO PDF</button></div></div>
    <div id="dfPaneArchive" class="dfOpsPane" style="display:none!important"><div class="dfOpsCard"><h3>Fotos arquivadas</h3><div class="dfOpsTiny">Neste teste as fotos ficam guardadas neste aparelho/navegador em armazenamento interno do app.</div><button id="dfZipMonth" class="dfOpsBtn alt">📦 BAIXAR BACKUP DAS FOTOS DO MÊS</button><div id="dfArchiveList"></div></div></div>
    <div id="dfOpModal" class="dfOpModal"><div class="dfOpModalBox"><button id="dfCloseModal" class="dfOpsBtn gray" style="margin-top:0">FECHAR</button><div id="dfModalBody"></div></div></div>
    <div id="dfScanModal" class="dfOpModal"><div class="dfOpModalBox dfScanWrap"><button id="dfCloseScan" class="dfOpsBtn gray" style="margin-top:0">FECHAR CÂMERA</button><video id="dfQrVideo" playsinline muted></video><canvas id="dfQrCanvas" style="display:none"></canvas><div id="dfScanStatus" class="dfOpsStatus">Procurando QR...</div></div></div>`}

  function mount(){addStyle();const area=$('foDevArea');if(!area||$('dfFormulaSubnav'))return;const core=document.createElement('div');core.id='dfFormulaCore';Array.from(area.children).forEach(ch=>core.appendChild(ch));const nav=document.createElement('div');nav.id='dfFormulaSubnav';nav.innerHTML='<button id="dfFormTabCore" class="on">🧪 FORMULAÇÃO</button><button id="dfFormTabOps">🤖 OPS AUTOMÁTICAS</button>';const ops=document.createElement('div');ops.id='dfFormulaOps';ops.innerHTML=build();area.append(nav,core,ops);$('dfFormTabCore').onclick=()=>switchMain(false);$('dfFormTabOps').onclick=()=>switchMain(true);ops.querySelectorAll('[data-pane]').forEach(b=>b.onclick=()=>switchPane(b.dataset.pane));bind();renderAll();if(new URLSearchParams(location.search).get('ops')==='1')switchMain(true)}
  function switchMain(on){$('dfFormulaCore').style.display=on?'none':'block';$('dfFormulaOps').classList.toggle('on',on);$('dfFormTabCore').classList.toggle('on',!on);$('dfFormTabOps').classList.toggle('on',on)}
  function switchPane(name){document.querySelectorAll('.dfOpsTabs button').forEach(b=>b.classList.toggle('on',b.dataset.pane===name));document.querySelectorAll('.dfOpsPane').forEach(p=>p.classList.remove('on'));$('dfPane'+name[0].toUpperCase()+name.slice(1))?.classList.add('on');if(name==='archive')renderArchive()}
  function bind(){$('dfOpMonth').value=monthNow();$('dfOpPhoto').onchange=photoChosen;$('dfOpMonth').onchange=renderAll;$('dfPrintReport').onclick=printReport;$('dfScanQr').onclick=startScanner;$('dfScanQrFile').onchange=scanFile;$('dfCloseScan').onclick=stopScanner;$('dfCloseModal').onclick=closeModal;$('dfZipMonth').onclick=zipMonth}

  function status(t,c=''){$('dfOpStatus').className='dfOpsStatus '+c;$('dfOpStatus').innerHTML=t}
  async function imageCanvas(file,max=2200){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('Foto inválida'))};img.src=u})}
  async function decodeQR(file){await loadQR();const c=await imageCanvas(file,1800),x=c.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,c.width,c.height),r=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});return r?.data||''}
  function expectedFor(id){return registry()[id]?.expected||null}
  function formulaIdFor(exp){return String(exp?.formulaId||exp?.__dfFormulaId||'').trim()}
  function parseDate(v){const m=String(v||'').match(/(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?/);if(!m)return'';let y=m[3]||String(new Date().getFullYear());if(y.length===2)y='20'+y;return y+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0')}
  function cleanLine(s){return String(s||'').replace(/[|]/g,' ').replace(/\s+/g,' ').trim()}
  function parseOcr(text,exp){
    const lines=String(text||'').split(/\n+/).map(cleanLine).filter(Boolean),all=lines.join('\n');
    const first=re=>{const m=all.match(re);return m?String(m[1]||'').trim():''};
    let numero=first(/(?:\bOS\b|\bOP\b)\s*[:#\-]?\s*([0-9]{1,10})/i);
    let data=parseDate(first(/(?:Data(?:\s+emiss[aã]o)?)\s*[:\-]?\s*(\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]\d{2,4})?)/i));
    let operador='',maquina='',apara=0,produzido=0,bobinas=0,row='';
    for(let i=0;i<lines.length;i++){
      const l=lines[i];
      const m=l.match(/(\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]\d{2,4})?)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ ._-]{1,22})\s+([A-Za-z0-9._-]{1,18})\s+([0-9.,]+)\s+([0-9.,]+)(?:\s+[^\s]+){0,5}\s*([0-9.,]+)?$/i);
      if(m){data=data||parseDate(m[1]);operador=m[2].trim();maquina=m[3].trim();apara=num(m[4]);produzido=num(m[5]);bobinas=num(m[6]);row=l;break}
    }
    if(!produzido){
      const header=lines.findIndex(l=>/Aparas?.*Quantidade/i.test(l));
      const search=header>=0?lines.slice(header+1,header+10):lines;
      for(const l of search){const nums=(l.match(/\b\d+(?:[.,]\d+)?\b/g)||[]).map(num).filter(n=>n>=0);if(nums.length>=2&&/(\d{1,2}[\/.\-]\d{1,2}|kg|extrus|maq|oper)/i.test(l)){apara=nums[Math.max(0,nums.length-2)]||0;produzido=nums[nums.length-1]||0;row=l;break}}
    }
    if(!operador)operador=first(/Operador\s*[:\-]?\s*([A-Za-zÀ-ÿ][^\n]{1,25})/i);
    if(!maquina)maquina=first(/M[aá]quina\s*[:\-]?\s*([A-Za-z0-9._ -]{1,20})/i);
    if(!apara)apara=num(first(/Aparas?\s*(?:\(kg\))?\s*[:\-]?\s*([0-9.,]+)/i));
    if(!produzido)produzido=num(first(/(?:Quantidade|Peso produzido|Produ[cç][aã]o)\s*(?:\(kg\))?\s*[:\-]?\s*([0-9.,]+)/i));
    return{numero,data,operador,maquina,apara,produzido,bobinas,row,product:exp?.title||'',largura:+exp?.largura||0,micra:+exp?.micra||0,gm:+exp?.gm||0}
  }
  function validate(p,exp,qr,ocrConfidence){const reasons=[];if(!qr||!/^DFOP-/i.test(qr))reasons.push('QR da OP não foi identificado');if(!exp)reasons.push('QR não encontrado no cadastro das OPs geradas');if(!(p.produzido>0))reasons.push('quantidade produzida não foi lida com segurança');if(!p.data)reasons.push('data não foi lida');if(!p.operador)reasons.push('operador não foi lido');if(!p.maquina)reasons.push('máquina não foi lida');if(p.apara<0||p.apara>p.produzido)reasons.push('apara fora do limite');if(exp?.totalKg>0&&p.produzido>exp.totalKg*1.35)reasons.push('produção lida muito acima do peso previsto da OP');if(ocrConfidence<45)reasons.push('qualidade da leitura da foto ficou baixa');return reasons}
  function buildMaterials(exp,produzido){return (exp?.materials||[]).map(m=>({name:m.name,pct:+m.pct||0,kg:produzido>0?produzido*(+m.pct||0)/100:0}))}

  async function photoChosen(e){selectedFile=e.target.files?.[0]||null;if(!selectedFile||working)return;const img=$('dfOpPreview');img.src=URL.createObjectURL(selectedFile);img.style.display='block';await processPhoto(selectedFile)}
  async function processPhoto(file){working=true;status('📷 Foto recebida. Procurando o QR da OP...','warn');let qr='',exp=null,ocrText='',confidence=0,p={};try{
      try{qr=await decodeQR(file)}catch(e){}exp=qr?expectedFor(qr):null;
      const provisional=qr||('SEMQR-'+Date.now());await photoPut(provisional,file,{qr:qr||'',month:monthNow()});
      status((qr?'✅ QR identificado: <b>'+esc(qr)+'</b><br>':'⚠️ QR ainda não identificado.<br>')+'Lendo os campos preenchidos automaticamente...','warn');
      await loadTess();const c=await imageCanvas(file,2200);const res=await window.Tesseract.recognize(c,'por',{logger:m=>{if(m.status==='recognizing text')status('🤖 Lendo a OP... <b>'+Math.round((m.progress||0)*100)+'%</b>','warn')}});ocrText=res?.data?.text||'';confidence=+res?.data?.confidence||0;p=parseOcr(ocrText,exp);
      const reasons=validate(p,exp,qr,confidence),fid=formulaIdFor(exp),id=qr||provisional,reviewReasons=['Aguardando conferência do dono da equipe',...reasons];if(!fid)reviewReasons.unshift('ID da formulação não veio no QR da OP');const rec={id,qr:qr||'',formulaId:fid,photoType:'formulation',createdAt:new Date().toISOString(),data:p.data||today(),numero:p.numero||'',operador:p.operador||'',maquina:p.maquina||'',produto:p.product||'',largura:p.largura||0,micra:p.micra||0,gm:p.gm||0,produzido:p.produzido||0,apara:p.apara||0,bobinas:p.bobinas||0,materials:buildMaterials(exp,p.produzido||0),expectedTotal:+exp?.totalKg||0,ocrConfidence:confidence,status:'pending',reasons:reviewReasons,ocrText:ocrText.slice(0,15000)};
      upsert(rec);status(reasons.length?'⚠️ Foto arquivada. A OP foi para <b>PENDENTES</b> porque: '+esc(reasons.join('; '))+'.':'✅ <b>OP salva automaticamente.</b><br>Produção: '+fmt(rec.produzido,2)+' kg • Apara: '+fmt(rec.apara,2)+' kg • Operador: '+esc(rec.operador),' '+(reasons.length?'warn':'ok'));
      if(!reasons.length)status('✅ <b>OP salva automaticamente.</b><br>Produção: '+fmt(rec.produzido,2)+' kg • Apara: '+fmt(rec.apara,2)+' kg • Operador: '+esc(rec.operador),'ok');
      $('dfOpPhoto').value='';selectedFile=null;
    }catch(e){status('❌ Não consegui concluir a leitura: '+esc(e.message||e)+'. A foto foi mantida quando possível.','bad')}finally{working=false;renderAll()}}
  function upsert(rec){const a=load(),i=a.findIndex(x=>x.id===rec.id);if(i>=0)a[i]=rec;else a.unshift(rec);save(a);try{window.dispatchEvent(new CustomEvent('df-op-saved',{detail:{record:rec,photoSync:false}}))}catch(e){}}

  function renderAll(){renderOk();renderPending();renderReport();renderArchive()}
  function itemHtml(o,pending){return `<div class="dfOpList"><strong>${esc(o.numero?'OP '+o.numero:o.id)}</strong><span class="dfOpBadge ${pending?'warn':'ok'}">${pending?'PENDENTE':'OK'}</span><div class="dfOpsTiny">${esc(o.data||'')} • ${esc(o.produto||'Sem produto')} • ${fmt(o.produzido||0,2)} kg • Apara ${fmt(o.apara||0,2)} kg</div>${pending?'<div class="dfPendingReason">'+esc((o.reasons||[]).join(' • '))+'</div>':''}<button class="dfOpsBtn gray" data-view="${esc(o.id)}">ABRIR FOTO</button></div>`}
  function bindViews(box){box?.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>openStored(b.dataset.view))}
  function dfCreatedAt(o){const qr=String(o.id||o.qr||'').match(/^DFOP-(\\d{8})-(\\d{6})-/i);if(qr){const d=qr[1],t=qr[2],n=new Date(Number(d.slice(0,4)),Number(d.slice(4,6))-1,Number(d.slice(6,8)),Number(t.slice(0,2)),Number(t.slice(2,4)),Number(t.slice(4,6))).getTime();if(Number.isFinite(n))return n}const v=o.createdAt||o.dataHora||o.data||'';return Date.parse(v)||0}
  function dfOpOrder(a,b){return 0}
    function dfPhotoOrder(a,b){return dfCreatedAt(b)-dfCreatedAt(a)||String(b.id||'').localeCompare(String(a.id||''))}
  function renderOk(){const b=$('dfOkList');if(!b)return;const a=load().filter(x=>x.status==='ok');const rows=Array.from(b.children).filter(r=>r.classList?.contains('dfOpList')),existing=new Map();for(const r of rows){const btn=r.querySelector('[data-view]'),rid=btn?normId(btn.getAttribute('data-view')):'';if(rid)existing.set(rid,r)}b.querySelectorAll(':scope > .dfOpsTiny[data-empty-ok]').forEach(x=>x.remove());let cursor=b.firstElementChild;for(const o of a){const id=normId(o?.id||o?.qr),html=itemHtml(o,false),sig=[o.data,o.produto,o.produzido,o.apara,o.status].join('|');let row=existing.get(id);if(!row){const t=document.createElement('template');t.innerHTML=html.trim();row=t.content.firstElementChild;if(row)row.dataset.renderSig=sig}else{existing.delete(id);if(row.dataset.renderSig!==sig){const t=document.createElement('template');t.innerHTML=html.trim();const fresh=t.content.firstElementChild;if(fresh){fresh.dataset.renderSig=sig;try{row.replaceWith(fresh);row=fresh}catch(e){row.innerHTML=fresh.innerHTML;row.className=fresh.className;row.dataset.renderSig=sig}}}}if(!row)continue;if(!row.parentNode){try{b.appendChild(row)}catch(e){}}cursor=row.nextElementSibling}for(const row of existing.values()){try{if(row.parentNode===b)b.removeChild(row)}catch(e){}}if(!a.length){const e=document.createElement('div');e.className='dfOpsTiny';e.dataset.emptyOk='1';e.textContent='Nenhuma OP concluída ainda.';b.appendChild(e)}bindViews(b)}
  function renderPending(){const b=$('dfPendingList');if(!b)return;const a=load().filter(x=>x.status==='pending').sort(dfOpOrder);b.innerHTML=a.length?a.map(o=>itemHtml(o,true)).join(''):'<div class="dfOpsStatus ok">✅ Nenhuma pendência.</div>';bindViews(b)}

  async function openStored(id){const rec=load().find(x=>x.id===id),ph=await photoGet(id);if(!rec&&!ph){alert('Foto não encontrada neste aparelho.');return}let cloudBlob=null;if(!ph){try{const map=JSON.parse(localStorage.getItem('df_op_photo_cloud_map_v1')||'{}'),remote=window.DFOpCloud?.photos?.()||[],match=remote.find(p=>String(p?.qr||p?.sourceId||'').trim().toUpperCase()===String(id).trim().toUpperCase()),photoId=String(match?.id||rec?.cloudPhotoId||map[String(id).toUpperCase()]?.photoId||'');if(photoId&&window.DFOpCloud?.getPhotoBlob)cloudBlob=await window.DFOpCloud.getPhotoBlob(photoId)}catch(e){}}const u=ph?.blob?URL.createObjectURL(ph.blob):cloudBlob?URL.createObjectURL(cloudBlob):'';$('dfModalBody').innerHTML=`${u?'<img id="dfStoredImg" src="'+u+'">':'<div class="dfOpsStatus warn">⚠️ FOTO ORIGINAL NÃO ENCONTRADA NESTE APARELHO OU NA NUVEM. OS DADOS DA OP CONTINUAM PRESERVADOS.</div>'}<div class="dfOpsStatus ${rec?.status==='ok'?'ok':'warn'}"><b>${esc(rec?.numero?'OP '+rec.numero:id)}</b><br>${rec?.reasons?.length?esc(rec.reasons.join(' • ')):'Leitura concluída.'}</div><div class="dfOpGrid"><div><label>Operador</label><input id="fixOperador" value="${esc(rec?.operador||'')}"></div><div><label>Máquina</label><input id="fixMaquina" value="${esc(rec?.maquina||'')}"></div><div><label>Produzido kg</label><input id="fixProd" inputmode="decimal" value="${rec?.produzido||''}"></div><div><label>Apara kg</label><input id="fixApara" inputmode="decimal" value="${rec?.apara||''}"></div></div><button id="dfFixSave" class="dfOpsBtn">✅ SALVAR CORREÇÃO E ENVIAR PARA CONFIRMAÇÃO</button>${u?'<button id="dfPhotoDownload" class="dfOpsBtn alt">⬇️ BAIXAR FOTO</button>':''}`;$('dfOpModal').classList.add('on');$('dfFixSave').onclick=()=>fixRecord(id);if(u)$('dfPhotoDownload').onclick=()=>downloadBlob(ph?.blob||cloudBlob,(rec?.numero?'OP-'+rec.numero:id)+'.jpg')}
  window.DFOpenStoredOpPhoto=(id)=>openStored(id);
  function closeModal(){$('dfOpModal').classList.remove('on');$('dfModalBody').innerHTML=''}
  function fixRecord(id){const a=load(),i=a.findIndex(x=>x.id===id);if(i<0)return;const o=a[i];o.operador=$('fixOperador').value.trim();o.maquina=$('fixMaquina').value.trim();o.produzido=num($('fixProd').value);o.apara=num($('fixApara').value);const exp=expectedFor(o.qr);o.materials=buildMaterials(exp,o.produzido);o.reasons=['Aguardando conferência do dono da equipe',...validate(o,exp,o.qr,100).filter(r=>r!=='qualidade da leitura da foto ficou baixa')];o.status='pending';a[i]=o;save(a);closeModal();try{window.dispatchEvent(new CustomEvent('df-op-saved',{detail:{record:o,photoSync:false}}))}catch(e){}}

  async function startScanner(){try{await loadQR();stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});$('dfQrVideo').srcObject=stream;await $('dfQrVideo').play();$('dfScanModal').classList.add('on');scanLoop()}catch(e){alert('Não consegui abrir a câmera: '+(e.message||e))}}
  function stopScanner(){if(scanTimer)clearTimeout(scanTimer);scanTimer=null;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}$('dfScanModal').classList.remove('on')}
  function scanLoop(){const v=$('dfQrVideo'),c=$('dfQrCanvas');if(!stream)return;try{if(v.videoWidth>0){c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(v,0,0,c.width,c.height);const d=x.getImageData(0,0,c.width,c.height),r=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});if(r?.data){const id=r.data;stopScanner();openStored(id);return}}}catch(e){}scanTimer=setTimeout(scanLoop,220)}
  async function scanFile(e){const f=e.target.files?.[0];if(!f)return;try{const id=await decodeQR(f);if(!id)alert('Não encontrei o QR nessa foto.');else openStored(id)}catch(err){alert('Falha ao ler QR.')}e.target.value=''}

  function monthRecords(){const m=$('dfOpMonth')?.value||monthNow();return load().filter(o=>(o.data||'').slice(0,7)===m)}
  function aggregate(list){const ok=list.filter(o=>o.status==='ok');let prod=0,ap=0,meters=0;const mats={},operators={},machines={};ok.forEach(o=>{prod+=+o.produzido||0;ap+=+o.apara||0;if(+o.gm>0)meters+=(+o.produzido||0)*1000/(+o.gm);if(o.operador)operators[o.operador]=(operators[o.operador]||0)+(+o.produzido||0);if(o.maquina)machines[o.maquina]=(machines[o.maquina]||0)+(+o.produzido||0);(o.materials||[]).forEach(m=>mats[m.name]=(mats[m.name]||0)+(+m.kg||0))});const liquid=Math.max(0,prod-ap),yieldPct=prod>0?liquid/prod*100:0;return{ok,pending:list.length-ok.length,prod,ap,liquid,yieldPct,meters,mats,operators,machines}}
  function rows(obj){const a=Object.entries(obj).sort((x,y)=>y[1]-x[1]);return a.length?a.map(([k,v])=>`<tr><td>${esc(k)}</td><td>${fmt(v,2)} kg</td></tr>`).join(''):'<tr><td colspan="2">—</td></tr>'}
  function renderReport(){const b=$('dfReport');if(!b)return;const list=monthRecords(),a=aggregate(list);b.innerHTML=`<div class="dfOpKpis" style="margin-top:10px"><div class="dfOpKpi"><span>OPs concluídas</span><b>${a.ok.length}</b></div><div class="dfOpKpi"><span>Pendentes</span><b>${a.pending}</b></div><div class="dfOpKpi"><span>Produção</span><b>${fmt(a.prod,2)} kg</b></div><div class="dfOpKpi"><span>Apara</span><b>${fmt(a.ap,2)} kg</b></div><div class="dfOpKpi"><span>Líquido</span><b>${fmt(a.liquid,2)} kg</b></div><div class="dfOpKpi"><span>Rendimento</span><b>${fmt(a.yieldPct,2)}%</b></div></div>${a.pending?'<div class="dfOpsStatus warn">⚠️ Há '+a.pending+' OP(s) pendente(s). Elas não entram nos totais até serem resolvidas.</div>':''}`}
  function reportHtml(){
  // Mesmo modelo visual do relatório gerencial de Produção. Dados da Formulação apenas em leitura.
  const list=monthRecords(),a=aggregate(list),m=$('dfOpMonth')?.value||monthNow();
  const totalProd=a.prod,totalScrap=a.ap,totalNet=a.liquid,scrapPct=totalProd>0?totalScrap/totalProd*100:0;
  const pct=v=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
  const monthLabel=value=>{
    const match=String(value||'').match(/^(\d{4})-(\d{2})$/);
    if(!match)return String(value||'');
    const names=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const month=Number(match[2]);
    return month>=1&&month<=12?names[month-1]+' De '+match[1]:String(value);
  };
  const canonical=name=>String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleUpperCase('pt-BR');
  const summary=(nameFor)=>{
    const map=new Map();
    for(const o of a.ok){
      const raw=String(nameFor(o)||'').trim()||'Não informado';
      const normalized=canonical(raw);
      const name=normalized==='BLOCADORA FLEX 900'?'BLOCADORA FLEX 900':raw;
      const key=canonical(name);
      const cur=map.get(key)||{name,production:0,scrap:0};
      cur.production+=(+o.produzido||0);
      cur.scrap+=(+o.apara||0);
      map.set(key,cur);
    }
    return Array.from(map.values()).sort((x,y)=>y.production-x.production||x.name.localeCompare(y.name,'pt-BR'));
  };
  const byMachine=summary(o=>o.maquina||'Máquina não informada');
  const byProduct=summary(o=>productFor(o)||'Produto não informado');
  const byOperator=summary(o=>o.operador||'Operador não informado');
  const groupRows=arr=>arr.length?arr.map((x,i)=>'<tr><td class="n">'+(i+1)+'</td><td class="name">'+esc(String(x.name).toLocaleUpperCase('pt-BR'))+'</td><td class="kg">'+fmt(x.production)+'</td><td class="kg">'+fmt(x.scrap)+'</td><td class="kg">'+pct(x.production>0?x.scrap/x.production*100:0)+'</td><td class="kg">'+fmt(Math.max(0,x.production-x.scrap))+'</td></tr>').join(''):'<tr><td class="empty" colspan="6">Nenhum registro concluído neste mês.</td></tr>';
  const machineRows=groupRows(byMachine),productRows=groupRows(byProduct),operatorRows=groupRows(byOperator);
  const opRows=a.ok.length?a.ok.map(o=>'<tr><td>'+esc(o.data||'—')+'</td><td>'+esc(o.numero||o.id||o.qr||'—')+'</td><td class="name">'+esc(productFor(o))+'</td><td>'+esc(o.operador||'—')+'</td><td>'+esc(o.maquina||'—')+'</td><td>'+fmt(+o.produzido||0)+'</td><td>'+fmt(+o.apara||0)+'</td></tr>').join(''):'<tr><td class="empty" colspan="7">Nenhuma OP concluída.</td></tr>';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DF EXTRUSOR PRO — Fechamento mensal de Extrusão</title><style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{margin:0;background:#edf2f9;color:#15243b;font:12px Arial,Helvetica,sans-serif}.sheet{width:min(1100px,100%);margin:18px auto;background:#fff;padding:28px 32px;box-shadow:0 6px 30px #10223f1b}.header{border-bottom:4px solid #e6a416;padding-bottom:16px;display:flex;justify-content:space-between;align-items:center;gap:15px}.brand{font-size:26px;font-weight:900;color:#10223f;letter-spacing:.5px}.brand span{color:#cf8f00}.subtitle{margin-top:5px;font-size:12px;letter-spacing:1.3px;font-weight:800;color:#65758c}.period{background:#10223f;color:#fff;border-radius:8px;padding:12px 18px;text-align:right}.period small{display:block;color:#c3d3eb;font-size:10px;letter-spacing:1px}.period b{display:block;font-size:15px;margin-top:4px;text-transform:capitalize}.section{margin:22px 0 10px;font-size:15px;color:#10223f;border-left:5px solid #e6a416;padding:4px 0 4px 10px}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.card{border:1px solid #dbe3ef;background:#f5f8fc;border-radius:8px;padding:14px;break-inside:avoid}.card small{display:block;font-size:10px;font-weight:800;color:#66758d;letter-spacing:.4px}.card strong{display:block;margin-top:7px;font-size:22px;color:#10223f;white-space:nowrap}.card.gold{background:#fff8e8;border-color:#e8c987}.card.gold strong{color:#996100}.explain{font-size:11px;color:#53647e;line-height:1.6;margin:9px 0 14px}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}th{background:#10223f;color:white;font-size:10px;text-transform:uppercase;letter-spacing:.2px;padding:10px 8px;text-align:right}td{padding:9px 8px;border-bottom:1px solid #e0e7f0;vertical-align:top;overflow-wrap:anywhere}tbody tr:nth-child(even){background:#f3f7fc}th.name,td.name{text-align:left;width:35%;font-weight:600}th.n,td.n{width:4%;text-align:center}td.kg{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}tfoot td{background:#e9eff8;font-weight:900;border-top:2px solid #9daec8}tfoot td:first-child{text-align:right}.empty{text-align:center;color:#64748b}.foot{border-top:1px solid #dbe3ef;margin-top:22px;padding-top:11px;display:flex;justify-content:space-between;color:#68778f;font-size:10px}.actions{width:min(1100px,100%);margin:16px auto 0;display:flex;gap:10px}.actions button{background:#10223f;border:0;border-radius:8px;color:white;padding:12px 18px;font-weight:800}.actions button:first-child{background:#e6a416;color:#10223f}@media(max-width:700px){.sheet{padding:16px 10px;margin:8px auto}.header{align-items:flex-start}.brand{font-size:17px}.subtitle{font-size:9px}.period{padding:8px;min-width:105px}.period b{font-size:11px}.cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.card{padding:10px}.card strong{font-size:17px}.report-table{overflow-x:auto}table{min-width:700px}.actions{padding:0 8px;margin-top:8px}}@media print{body{background:#fff;print-color-adjust:exact;-webkit-print-color-adjust:exact}.actions{display:none}.sheet{width:100%;margin:0;padding:0;box-shadow:none}.report-table{overflow:visible}table{min-width:0}th,td{padding:7px 6px}.cards{grid-template-columns:repeat(4,minmax(0,1fr))}.section{break-after:avoid}.brand{font-size:24px}}.ops-detail{font-size:9px}.ops-detail th,.ops-detail td{padding:7px 5px}.ops-detail th{font-size:9px}.ops-detail td:first-child{white-space:nowrap}.ops-detail td:nth-last-child(-n+2){text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.ops-detail td:nth-child(2){overflow-wrap:anywhere}@media(max-width:700px){.ops-detail{min-width:980px}}@media print{.ops-detail{min-width:0;font-size:8px}.ops-detail th,.ops-detail td{padding:6px 4px}} 
/* DF: faixas horizontais contínuas e células alinhadas no PDF de Extrusão */
.report-table{width:100%}
.report-table table{width:100%;border-spacing:0}
.report-table thead th{background:#10223f;color:#fff}
.report-table tbody tr:nth-child(odd)>td{background:#ffffff}
.report-table tbody tr:nth-child(even)>td{background:#f3f7fc}
.report-table tbody tr>td{background-clip:border-box}
.report-table th.n,.report-table td.n{width:6%;min-width:32px;white-space:nowrap;overflow-wrap:normal;word-break:keep-all;text-align:center}
.ops-detail th.name,.ops-detail td.name{width:25%;text-align:left}
.ops-detail th:nth-child(1),.ops-detail td:nth-child(1){width:11%}
.ops-detail th:nth-child(2),.ops-detail td:nth-child(2){width:23%;white-space:nowrap;overflow-wrap:normal;word-break:normal;letter-spacing:-.15px}
.ops-detail th:nth-child(4),.ops-detail td:nth-child(4){width:9%}
.ops-detail th:nth-child(5),.ops-detail td:nth-child(5){width:16%}
.ops-detail th:nth-child(6),.ops-detail td:nth-child(6){width:9%}
.ops-detail th:nth-child(7),.ops-detail td:nth-child(7){width:7%}
@media print{
  .sheet,.sheet .report-table,.sheet table,.sheet thead,.sheet tbody,.sheet tr,.sheet th,.sheet td{
    -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important
  }
  .report-table{display:block;width:100%;overflow:visible!important}
  .report-table table{width:100%;min-width:0!important;border-collapse:collapse;table-layout:fixed}
  .report-table thead{display:table-header-group}
  .report-table tbody tr{break-inside:avoid-page!important;page-break-inside:avoid!important}
  .report-table tbody td{break-inside:avoid!important;page-break-inside:avoid!important}
  .report-table tbody tr:nth-child(odd)>td{background:#ffffff!important}
  .report-table tbody tr:nth-child(even)>td{background:#f3f7fc!important}
  .report-table thead th{background:#10223f!important;color:#fff!important}
  .report-table th.n,.report-table td.n{min-width:0;width:6%;white-space:nowrap}
  .ops-detail{width:100%;table-layout:fixed;font-size:8px}
  .ops-detail th,.ops-detail td{padding:7px 4px}
  .ops-detail td:nth-child(2){font-size:7px;letter-spacing:-.2px}
}
</style></head><body><div class="actions"><button onclick="window.print()">IMPRIMIR / SALVAR PDF</button><button onclick="window.close()">FECHAR</button></div><main class="sheet"><header class="header"><div><div class="brand">DF EXTRUSOR <span>PRO</span></div><div class="subtitle">RELATÓRIO GERENCIAL DE EXTRUSÃO</div></div><div class="period"><small>FECHAMENTO DO MÊS</small><b>${esc(monthLabel(m))}</b></div></header><h2 class="section">Resumo geral do mês</h2><div class="cards"><div class="card"><small>PRODUÇÃO BRUTA</small><strong>${fmt(totalProd)} kg</strong></div><div class="card"><small>APARA TOTAL</small><strong>${fmt(totalScrap)} kg</strong></div><div class="card"><small>PRODUÇÃO LÍQUIDA</small><strong>${fmt(totalNet)} kg</strong></div><div class="card gold"><small>ÍNDICE DE APARA</small><strong>${pct(scrapPct)}</strong></div></div><p class="explain">Produção bruta = total registrado nas baixas. Apara = perdas registradas. Produção líquida = produção bruta − apara. Índice de apara = apara ÷ produção bruta × 100.</p><p class="explain">OPs concluídas: <b>${a.ok.length}</b> • Pendentes: <b>${a.pending}</b> • Rendimento: <b>${pct(a.yieldPct)}</b> • Metros estimados: <b>${fmt(a.meters,0)}</b>. Apenas OPs concluídas entram nos totais.</p><h2 class="section">Desempenho por máquina</h2><div class="report-table"><table><thead><tr><th class="n">#</th><th class="name">Máquina</th><th>Produção (kg)</th><th>Apara (kg)</th><th>Apara (%)</th><th>Líquida (kg)</th></tr></thead><tbody>${machineRows}</tbody><tfoot><tr><td colspan="2">TOTAL DO MÊS</td><td class="kg">${fmt(totalProd)}</td><td class="kg">${fmt(totalScrap)}</td><td class="kg">${pct(scrapPct)}</td><td class="kg">${fmt(totalNet)}</td></tr></tfoot></table></div><h2 class="section">Desempenho por produto</h2><div class="report-table"><table><thead><tr><th class="n">#</th><th class="name">Produto</th><th>Produção (kg)</th><th>Apara (kg)</th><th>Apara (%)</th><th>Líquida (kg)</th></tr></thead><tbody>${productRows}</tbody></table></div>
<h2 class="section">Desempenho por operador</h2><div class="report-table"><table><thead><tr><th class="n">#</th><th class="name">Operador</th><th>Produção (kg)</th><th>Apara (kg)</th><th>Apara (%)</th><th>Líquida (kg)</th></tr></thead><tbody>${operatorRows}</tbody></table></div>
<h2 class="section">OPs concluídas</h2><div class="report-table"><table class="ops-detail"><thead><tr><th>Data</th><th>OP / QR</th><th class="name">Produto</th><th>Operador</th><th>Máquina</th><th>Produção (kg)</th><th>Apara (kg)</th></tr></thead><tbody>${opRows}</tbody></table></div>
<footer class="foot"><span>DF EXTRUSOR PRO • Relatório mensal de extrusão</span><span>Emitido em ${new Date().toLocaleString('pt-BR')}</span></footer></main></body></html>`;
}

  async function printReport(){const w=window.open('','_blank');if(!w){alert('Libere pop-up.');return}await readOriginalProducts();w.document.open();w.document.write(reportHtml());w.document.close();setTimeout(()=>w.print(),450)}

  async function renderArchive(){const b=$('dfArchiveList');if(!b)return;const list=monthRecords().sort(dfPhotoOrder);const signature=list.map(o=>[o.id,o.status,o.numero,o.qr].join(':')).join('|');if(b.dataset.dfArchiveSig===signature&&b.dataset.dfArchiveMonth===String($('dfOpMonth')?.value||monthNow()))return;b.dataset.dfArchiveSig=signature;b.dataset.dfArchiveMonth=String($('dfOpMonth')?.value||monthNow());b.innerHTML=list.length?list.map(o=>`<div class="dfOpList"><strong>${esc(o.numero?'OP '+o.numero:o.id)}</strong><span class="dfOpBadge ${o.status==='ok'?'ok':'warn'}">${o.status==='ok'?'OK':'PENDENTE'}</span><div class="dfOpsTiny">Foto ligada ao QR ${esc(o.qr||'sem QR')}</div><div class="dfArchiveBtns"><button class="dfOpsBtn gray" data-view="${esc(o.id)}">ABRIR FOTO</button><button class="dfOpsBtn danger" data-delphoto="${esc(o.id)}">EXCLUIR FOTO + OP</button></div></div>`).join(''):'<div class="dfOpsTiny">Nenhuma foto neste mês.</div>';bindViews(b);b.querySelectorAll('[data-delphoto]').forEach(x=>x.onclick=async()=>{if(!confirm('Excluir esta OP e a foto arquivada?'))return;await photoDelete(x.dataset.delphoto);save(load().filter(o=>o.id!==x.dataset.delphoto))})}
  function downloadBlob(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}
  async function zipMonth(){const list=monthRecords();if(!list.length){alert('Não há fotos neste mês.');return}try{await loadZip();const z=new JSZip();let n=0;for(const o of list){const p=await photoGet(o.id);if(p?.blob){const ext=(p.mime||'').includes('png')?'png':'jpg';z.file((o.numero?'OP-'+o.numero:o.id)+'.'+ext,p.blob);n++}}if(!n){alert('Nenhuma foto encontrada neste aparelho.');return}const blob=await z.generateAsync({type:'blob'});downloadBlob(blob,'DF-OPs-'+($('dfOpMonth').value||monthNow())+'.zip')}catch(e){alert('Falha ao gerar backup: '+(e.message||e))}}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,500),{once:true});else setTimeout(mount,500);window.addEventListener('df-ui-ready',()=>setTimeout(mount,350));window.addEventListener('df-op-formula-status',()=>setTimeout(renderAll,0));setTimeout(mount,1200);setTimeout(mount,2200);
})();
