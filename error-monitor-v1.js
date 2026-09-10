(function(){
  'use strict';

  const VERSION='1.0.115';
  const LOG_KEY='df_error_log_v1';
  const MAX_LOGS=30;
  const DEDUPE_MS=10*60*1000;
  const TOAST_COOLDOWN=7000;
  let lastToastAt=0,lastAction='',lastActive=Date.now(),lastTick=performance.now(),lastPerfAt=0;

  const $=id=>document.getElementById(id);
  const nowIso=()=>new Date().toISOString();
  const clip=(v,n)=>String(v??'').slice(0,n||300);
  const scrub=(value)=>{
    let s=String(value??'');
    s=s.replace(/([?&](?:acesso|token|key|license|licenca|credential|authorization)=)[^&#\s]+/gi,'$1[OCULTO]');
    s=s.replace(/(Bearer\s+)[A-Za-z0-9._~-]+/gi,'$1[OCULTO]');
    s=s.replace(/\b[A-Za-z0-9_-]{80,}\b/g,'[DADO-LONGO-OCULTO]');
    s=s.replace(/https?:\/\/([^\s?#]+)[^\s]*/gi,(m,host)=>'https://'+host+'/…');
    return clip(s,500);
  };
  const basename=(v)=>{try{const u=new URL(String(v||''),location.href);return clip((u.pathname.split('/').pop()||u.pathname||'app'),100)}catch(e){return clip(String(v||'').split('?')[0].split('/').pop()||'app',100)}};
  const load=()=>{try{const a=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}};
  const save=a=>{try{localStorage.setItem(LOG_KEY,JSON.stringify(a.slice(0,MAX_LOGS)))}catch(e){}};

  function areaFor(text){
    const s=String(text||'').toLowerCase();
    if(/op-|formula-op|qr|photo|foto|manual-confirm/.test(s))return'OP';
    if(/auth|license|licen|access|session|login/.test(s))return'AUTH';
    if(/cloud|backup|r2|sync|push/.test(s))return'CLOUD';
    if(/pdf|print|impress/.test(s))return'PDF';
    if(/formula|material|mix/.test(s))return'FORM';
    if(/calc|extrus|sacola|custo|bobina/.test(s))return'CALC';
    if(/performance|trav|freeze|long task/.test(s))return'PERF';
    return'APP';
  }
  function hash3(text){
    let h=2166136261,s=String(text||'');
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return String((h>>>0)%999+1).padStart(3,'0');
  }
  function actionName(el){
    if(!el||!el.tagName)return'';
    const id=el.id?'#'+el.id:'';
    const act=el.dataset&&(el.dataset.pane||el.dataset.action||el.dataset.view||el.dataset.cloudOpen||el.dataset.cloudDown);
    return clip(el.tagName+id+(act?'['+act+']':''),90);
  }
  function stackTop(stack){
    return scrub(String(stack||'').split('\n').slice(0,4).join(' | '));
  }

  function build(kind,data){
    data=data||{};
    const message=scrub(data.message||data.reason||kind||'Erro desconhecido');
    const file=basename(data.filename||data.file||'');
    const stack=stackTop(data.stack||'');
    const signature=[kind,message,file,data.line||0,data.col||0,stack].join('|');
    const area=areaFor([message,file,stack,lastAction].join(' '));
    return{
      code:'DF-'+area+'-'+hash3(signature),
      kind:clip(kind,24),
      message:clip(message,300),
      file,
      line:Number(data.line)||0,
      col:Number(data.col)||0,
      stack:clip(stack,500),
      at:nowIso(),
      version:VERSION,
      page:location.pathname,
      online:navigator.onLine!==false,
      standalone:!!(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true,
      action:lastAction||'',
      count:1
    };
  }

  function copyText(text){
    try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text)}catch(e){}
    return new Promise((resolve,reject)=>{try{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();resolve()}catch(e){reject(e)}});
  }
  function diagnosticText(rec){
    if(!rec)return'DF EXTRUSOR PRO — nenhum erro registrado.';
    return[
      'DF EXTRUSOR PRO — diagnóstico',
      'Código: '+rec.code,
      'Versão: '+rec.version,
      'Data: '+rec.at,
      'Área: '+rec.kind,
      'Mensagem: '+rec.message,
      rec.file?'Arquivo: '+rec.file+(rec.line?':'+rec.line:''):'',
      rec.action?'Última ação: '+rec.action:'',
      'Internet: '+(rec.online?'sim':'não'),
      'Ocorrências: '+(rec.count||1)
    ].filter(Boolean).join('\n');
  }

  function ensureUi(){
    if($('dfErrorMonitorStyle'))return;
    const st=document.createElement('style');st.id='dfErrorMonitorStyle';st.textContent=`
      #dfErrorToast{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;width:min(92vw,520px);background:#17110a;border:1px solid #d97706;color:#fef3c7;border-radius:14px;padding:12px;box-shadow:0 18px 55px #0009;font:700 12px system-ui;display:none}
      #dfErrorToast.on{display:block}#dfErrorToast b{color:#fbbf24;font-size:14px}#dfErrorToast .dfErrBtns{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
      #dfErrorToast button,#dfErrorModal button{border:1px solid #475569;background:#111827;color:#e5e7eb;border-radius:10px;padding:10px;font:900 11px system-ui}
      #dfErrorModal{position:fixed;inset:0;z-index:2147483001;background:#020617f2;padding:15px;overflow:auto;display:none}#dfErrorModal.on{display:block}
      #dfErrorModal .dfErrBox{max-width:620px;margin:30px auto;background:#111827;border:1px solid #334155;border-radius:16px;padding:14px;color:#e2e8f0;font:600 12px/1.45 system-ui}
      #dfErrorModal pre{white-space:pre-wrap;word-break:break-word;background:#080f1d;border:1px solid #263244;border-radius:10px;padding:10px;color:#cbd5e1;max-height:45vh;overflow:auto}
      #dfErrorModal .dfErrGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}@media(max-width:430px){#dfErrorToast .dfErrBtns,#dfErrorModal .dfErrGrid{grid-template-columns:1fr}}
    `;document.head.appendChild(st);

    const toast=document.createElement('div');toast.id='dfErrorToast';toast.setAttribute('role','status');toast.innerHTML='<b id="dfErrorToastCode">⚠️ ERRO DETECTADO</b><div id="dfErrorToastMsg" style="margin-top:4px"></div><div class="dfErrBtns"><button id="dfErrorCopy">📋 COPIAR CÓDIGO</button><button id="dfErrorDetails">🛠️ DETALHES</button></div>';document.body.appendChild(toast);
    $('dfErrorCopy').onclick=async()=>{const r=load()[0];if(!r)return;await copyText(r.code);$('dfErrorCopy').textContent='✅ '+r.code;setTimeout(()=>{$('dfErrorCopy').textContent='📋 COPIAR CÓDIGO'},1800)};
    $('dfErrorDetails').onclick=()=>openModal();

    const modal=document.createElement('div');modal.id='dfErrorModal';modal.innerHTML='<div class="dfErrBox"><div style="font-size:18px;font-weight:950">🛠️ Diagnóstico do app</div><div style="margin-top:4px;color:#94a3b8">Envie o código ou copie o diagnóstico quando precisar me mostrar um problema.</div><pre id="dfErrorDiag"></pre><div class="dfErrGrid"><button id="dfErrorCopyDiag">📋 COPIAR DIAGNÓSTICO</button><button id="dfErrorClear">🗑️ LIMPAR HISTÓRICO</button><button id="dfErrorClose" style="grid-column:1/-1">FECHAR</button></div></div>';document.body.appendChild(modal);
    $('dfErrorClose').onclick=()=>modal.classList.remove('on');
    $('dfErrorCopyDiag').onclick=async()=>{const r=load()[0];await copyText(diagnosticText(r));$('dfErrorCopyDiag').textContent='✅ COPIADO';setTimeout(()=>{$('dfErrorCopyDiag').textContent='📋 COPIAR DIAGNÓSTICO'},1600)};
    $('dfErrorClear').onclick=()=>{save([]);$('dfErrorDiag').textContent='Nenhum erro registrado.'};
  }
  function openModal(){ensureUi();const a=load(),r=a[0];$('dfErrorDiag').textContent=r?diagnosticText(r)+'\n\nÚltimos códigos: '+a.slice(0,8).map(x=>x.code+(x.count>1?' x'+x.count:'')).join(', '):'Nenhum erro registrado.';$('dfErrorModal').classList.add('on')}
  function showToast(rec){
    const now=Date.now();if(now-lastToastAt<TOAST_COOLDOWN)return;lastToastAt=now;
    ensureUi();$('dfErrorToastCode').textContent='⚠️ '+rec.code;$('dfErrorToastMsg').textContent='Detectei um problema no app. Se acontecer de novo, me envie este código.';
    const t=$('dfErrorToast');t.classList.add('on');clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('on'),9000);
  }

  function record(kind,data,visible){
    try{
      const rec=build(kind,data),a=load(),now=Date.now();
      const same=a.findIndex(x=>x&&x.code===rec.code&&(now-Date.parse(x.at||0))<DEDUPE_MS);
      if(same>=0){const old=a.splice(same,1)[0];rec.count=(old.count||1)+1}
      a.unshift(rec);save(a);
      try{window.dispatchEvent(new CustomEvent('df-error-recorded',{detail:{code:rec.code,kind:rec.kind}}))}catch(e){}
      if(visible!==false)showToast(rec);
      return rec;
    }catch(e){return null}
  }

  window.addEventListener('error',function(e){
    if(e&&e.target&&e.target!==window){
      const src=e.target.src||e.target.href||'';
      if(src)record('resource',{message:'Falha ao carregar recurso',filename:src},true);
      return;
    }
    record('javascript',{message:e.message||'Erro JavaScript',filename:e.filename||'',line:e.lineno,col:e.colno,stack:e.error&&e.error.stack},true);
  },true);

  window.addEventListener('unhandledrejection',function(e){
    const r=e&&e.reason;record('promise',{message:r&&r.message?r.message:String(r||'Falha assíncrona'),stack:r&&r.stack||''},true);
  });

  document.addEventListener('pointerdown',e=>{lastActive=Date.now();lastAction=actionName(e.target&&e.target.closest?e.target.closest('button,a,input,select,textarea'):e.target)},true);
  document.addEventListener('input',e=>{lastActive=Date.now();lastAction=actionName(e.target)},true);
  document.addEventListener('visibilitychange',()=>{lastTick=performance.now();if(!document.hidden)lastActive=Date.now()});

  setInterval(()=>{
    const now=performance.now(),lag=now-lastTick-2000;lastTick=now;
    if(document.hidden||lag<10000||Date.now()-lastActive>60000||Date.now()-lastPerfAt<5*60*1000)return;
    lastPerfAt=Date.now();record('performance',{message:'Interface ficou sem responder por aproximadamente '+Math.round(lag/1000)+' s',filename:'runtime'},true);
  },2000);

  window.DFErrorMonitor={
    report:(message,meta)=>record('manual',{message,...(meta||{})},true),
    open:openModal,
    last:()=>load()[0]||null,
    list:()=>load().slice(),
    clear:()=>save([]),
    copyLast:()=>{const r=load()[0];return copyText(r?r.code:'SEM-ERRO')}
  };
})();
