(function(){
'use strict';
if(window.DFAssistenteAoVivoV6)return;

const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const BRIDGE_ORIGIN='https://df-assistente-ai-bridge-ch5rh9.v2.appdeploy.ai';
const BRIDGE_URL=BRIDGE_ORIGIN+'/';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9%.,+\- ]/g,' ').replace(/\s+/g,' ').trim();
let rec=null,listening=false,speaking=false,bridge=null,bridgeReady=false;
let history=[];
const pending=new Map();

const css=`
#dfSupportFab{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:99998;width:60px;height:60px;border-radius:50%;border:1.5px solid #f5a000;background:#111827;color:#ffd36a;box-shadow:0 12px 35px #0009;display:flex;align-items:center;justify-content:center;font-size:27px;cursor:pointer}
#dfSupportFab.on{background:#2b1a00;box-shadow:0 0 0 5px #f5a00022,0 12px 35px #0009}
#dfSupportPanel{position:fixed;inset:0;z-index:99997;background:#080b13;display:none;flex-direction:column;color:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}
#dfSupportPanel.open{display:flex}.dfspHead{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #263244;background:#0c111b}.dfspMark{width:42px;height:42px;border:1px solid #f5a000;border-radius:13px;display:grid;place-items:center;color:#ffd36a;font-size:21px}.dfspTitle{flex:1}.dfspTitle b{display:block;font-size:19px}.dfspTitle span{display:block;color:#94a3b8;font-size:12px;margin-top:2px}.dfspClose{border:1px solid #334155;background:#111827;color:#fff;border-radius:12px;width:42px;height:42px;font-size:22px}.dfspMsgs{flex:1;overflow:auto;padding:18px 14px 128px;max-width:760px;width:100%;margin:auto;box-sizing:border-box}.dfspMsg{max-width:88%;padding:12px 14px;border-radius:16px;margin:0 0 12px;line-height:1.45;font-size:15px;white-space:pre-wrap}.dfspBot{background:#111827;border:1px solid #263244;color:#e5e7eb;border-top-left-radius:5px}.dfspUser{background:#2a1b02;border:1px solid #7a5300;color:#fff;margin-left:auto;border-top-right-radius:5px}.dfspThinking{opacity:.72}.dfspQuick{display:flex;gap:7px;overflow:auto;padding:0 14px 10px;max-width:760px;width:100%;margin:auto;box-sizing:border-box}.dfspQuick button{white-space:nowrap;border:1px solid #334155;background:#0f172a;color:#cbd5e1;border-radius:999px;padding:8px 11px;font-weight:750}.dfspBar{position:absolute;left:0;right:0;bottom:0;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:linear-gradient(180deg,#080b1300,#080b13 18%,#080b13)}.dfspCompose{max-width:760px;margin:auto;display:grid;grid-template-columns:46px 1fr 72px;gap:8px}.dfspMic,.dfspSend{border:1px solid #f5a000;background:#211400;color:#ffd36a;border-radius:13px;font-weight:900}.dfspMic.on{background:#f5a000;color:#111827}.dfspInput{border:1px solid #334155!important;background:#0f172a!important;color:#fff!important;border-radius:13px!important;padding:12px!important;font-size:16px!important;width:100%!important;margin:0!important;box-sizing:border-box}.dfspListen{max-width:760px;margin:0 auto 7px;color:#94a3b8;font-size:12px;min-height:16px;padding:0 2px}.dfspListen.on{color:#ffd36a}
.dfspAction{font-size:12px;color:#f6c453;margin:-5px 0 12px 4px}
@media(min-width:800px){#dfSupportPanel{inset:5vh calc(50% - 390px);border:1px solid #263244;border-radius:22px;overflow:hidden;box-shadow:0 30px 100px #000c}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

function visible(el){
 if(!el)return false;
 const s=getComputedStyle(el);
 return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';
}
function appContext(){
 const clickables=[...document.querySelectorAll('button,a,[role="button"],[onclick],.tab,.card,.menu-item')].filter(visible).map(e=>(e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim()).filter(Boolean).slice(0,180);
 const fields=[...document.querySelectorAll('input,select,textarea')].filter(visible).map(e=>{
   const id=e.id||'';
   const label=id?document.querySelector(`label[for="${CSS.escape(id)}"]`):null;
   const name=(label?.textContent||e.getAttribute('aria-label')||e.getAttribute('placeholder')||e.name||id||e.tagName).trim();
   const value=e.type==='password'?'[protegido]':String(e.value||'').slice(0,120);
   return `${name}: ${value}`;
 }).slice(0,100);
 const headings=[...document.querySelectorAll('h1,h2,h3,.title,.section-title')].filter(visible).map(e=>(e.textContent||'').trim()).filter(Boolean).slice(0,60);
 const bodyText=(document.body?.innerText||'').replace(/\s+/g,' ').slice(0,4500);
 return [
   `URL: ${location.pathname}${location.search}`,
   `Títulos: ${headings.join(' | ')}`,
   `Itens clicáveis: ${clickables.join(' | ')}`,
   `Campos atuais: ${fields.join(' | ')}`,
   `Texto visível: ${bodyText}`
 ].join('\n').slice(0,8500);
}
function ensureBridge(){
 if(bridge&&document.body.contains(bridge))return bridge;
 bridge=document.createElement('iframe');
 bridge.src=BRIDGE_URL;
 bridge.title='DF Assistente AI';
 bridge.setAttribute('aria-hidden','true');
 bridge.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px;border:0';
 bridge.onload=()=>{bridgeReady=true};
 document.body.appendChild(bridge);
 return bridge;
}
window.addEventListener('message',e=>{
 if(e.origin!==BRIDGE_ORIGIN||e.data?.type!=='df-assistant-response'||!e.data?.id)return;
 const p=pending.get(e.data.id);if(!p)return;
 pending.delete(e.data.id);clearTimeout(p.timer);
 if(e.data.error)p.reject(new Error(e.data.error));else p.resolve(e.data);
});
function askAI(message){
 ensureBridge();
 return new Promise((resolve,reject)=>{
   const id='df-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
   const timer=setTimeout(()=>{pending.delete(id);reject(new Error('timeout'))},18000);
   pending.set(id,{resolve,reject,timer});
   const send=()=>bridge?.contentWindow?.postMessage({type:'df-assistant-request',id,message,history:history.slice(-12),appContext:appContext()},BRIDGE_ORIGIN);
   if(bridgeReady)send();else setTimeout(send,650);
 });
}
function fallback(raw){
 const q=norm(raw);
 if(/formul/.test(q))return 'Posso te guiar na Formulação. Entre em FORMULAÇÃO e me diga o que você quer fazer: cadastrar material, montar uma fórmula ou abrir uma fórmula salva.';
 if(/materia|material/.test(q))return 'Para cadastrar material, abra a área de cadastro de matéria-prima dentro de Formulação, preencha os dados do material e salve.';
 if(/extrus/.test(q))return 'Na Extrusão eu posso te orientar por largura, micra, densidade, matriz, BUR, GAP e DDR. Me diga qual cálculo você quer fazer.';
 return 'Estou com dificuldade para acessar a inteligência ao vivo agora. Tente de novo em alguns segundos.';
}
function addMsg(text,who,extra=''){
 const box=document.getElementById('dfspMsgs');if(!box)return null;
 const d=document.createElement('div');d.className='dfspMsg '+(who==='user'?'dfspUser':'dfspBot')+(extra?' '+extra:'');d.textContent=text;box.appendChild(d);box.scrollTop=box.scrollHeight;return d;
}
function findTarget(target){
 const t=norm(target);if(!t)return null;
 const els=[...document.querySelectorAll('button,a,[role="button"],[onclick],.tab,.card,.menu-item,label')].filter(visible);
 let hit=els.find(e=>norm(e.innerText||e.textContent||e.getAttribute('aria-label'))===t);
 if(!hit)hit=els.find(e=>norm(e.innerText||e.textContent||e.getAttribute('aria-label')).includes(t));
 if(!hit)hit=els.find(e=>t.includes(norm(e.innerText||e.textContent||e.getAttribute('aria-label')))&&norm(e.innerText||e.textContent||e.getAttribute('aria-label')).length>3);
 return hit||null;
}
function executeActions(actions){
 if(!Array.isArray(actions))return;
 actions.forEach((a,i)=>setTimeout(()=>{
   if(!a||!a.type||a.type==='none')return;
   const el=findTarget(a.target||'');
   if(!el)return;
   if(a.type==='highlight'){
     el.scrollIntoView({behavior:'smooth',block:'center'});
     const old=el.style.outline;el.style.outline='3px solid #f5a000';setTimeout(()=>{el.style.outline=old},2200);
     return;
   }
   if(a.type==='navigate'){
     try{el.click();const note=document.createElement('div');note.className='dfspAction';note.textContent='✓ Abri: '+(a.target||'área solicitada');document.getElementById('dfspMsgs')?.appendChild(note)}catch(_){}
   }
 },450+i*350));
}
async function ask(text,voice){
 text=String(text||'').trim();if(!text)return;
 addMsg(text,'user');
 const wait=addMsg('Pensando...','bot','dfspThinking');
 try{
   const result=await askAI(text);
   wait?.remove();
   const reply=String(result.reply||fallback(text));
   addMsg(reply,'bot');
   history.push({role:'user',content:text},{role:'assistant',content:reply});
   history=history.slice(-16);
   executeActions(result.actions);
   if(voice)speak(reply);
 }catch(_){
   wait?.remove();
   const reply=fallback(text);addMsg(reply,'bot');if(voice)speak(reply);
 }
}
function speak(text){
 if(!('speechSynthesis' in window))return;
 try{
   speaking=true;
   if(rec&&listening){try{rec.stop()}catch(_){}}
   speechSynthesis.cancel();
   const u=new SpeechSynthesisUtterance(String(text).replace(/\n/g,' '));u.lang='pt-BR';u.rate=1.03;
   u.onend=u.onerror=()=>{speaking=false;if(listening)setTimeout(startRec,220)};
   speechSynthesis.speak(u);
 }catch(_){speaking=false}
}
function setListen(on){
 listening=!!on;
 document.getElementById('dfSupportFab')?.classList.toggle('on',listening);
 document.getElementById('dfspMic')?.classList.toggle('on',listening);
 const s=document.getElementById('dfspListen');
 if(s){s.classList.toggle('on',listening);s.textContent=listening?'● Ouvindo — fale normalmente':'Toque no microfone para falar'}
}
function makeRec(){
 if(!SR)return null;
 const r=new SR();r.lang='pt-BR';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;
 r.onstart=()=>setListen(true);
 r.onresult=e=>{
   let interim='';
   for(let i=e.resultIndex;i<e.results.length;i++){
     const t=(e.results[i][0]?.transcript||'').trim();if(!t)continue;
     if(e.results[i].isFinal)ask(t,true);else interim+=t+' ';
   }
   const s=document.getElementById('dfspListen');if(s&&interim)s.textContent='Ouvindo: '+interim.trim();
 };
 r.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){setListen(false);addMsg('Permita o acesso ao microfone para conversar comigo.','bot')}};
 r.onend=()=>{if(listening&&!speaking)setTimeout(startRec,250)};
 return r;
}
function startRec(){
 if(!listening||speaking)return;
 if(!SR){setListen(false);addMsg('O reconhecimento de voz não está disponível neste navegador. Você pode digitar sua pergunta.','bot');return}
 try{if(!rec)rec=makeRec();rec.start()}catch(_){}
}
function toggleRec(){
 if(listening){setListen(false);try{rec?.stop()}catch(_){}}
 else{setListen(true);startRec()}
}
function open(){
 ensureBridge();
 document.getElementById('dfSupportPanel')?.classList.add('open');
 document.body.style.overflow='hidden';
 setTimeout(()=>document.getElementById('dfspInput')?.focus(),80);
}
function close(){
 document.getElementById('dfSupportPanel')?.classList.remove('open');
 document.body.style.overflow='';
 if(listening)toggleRec();
 try{speechSynthesis?.cancel()}catch(_){}
}
function ensure(){
 if(document.getElementById('dfSupportFab'))return;
 ensureBridge();
 const panel=document.createElement('div');panel.id='dfSupportPanel';
 panel.innerHTML=`<div class="dfspHead"><div class="dfspMark">🎙</div><div class="dfspTitle"><b>Assistente DF — ao vivo</b><span>Conversa, explica e navega pelo DF EXTRUSOR PRO</span></div><button class="dfspClose" id="dfspClose" aria-label="Fechar">×</button></div><div class="dfspMsgs" id="dfspMsgs"><div class="dfspMsg dfspBot">Fala! Eu sou o Assistente DF. Pode falar normalmente comigo. Posso explicar o aplicativo e também abrir as áreas pra você.</div></div><div class="dfspQuick"><button data-q="Entra na Formulação pra mim">Abrir Formulação</button><button data-q="Me explica como fazer uma formulação">Como formular</button><button data-q="Abre o cadastro de material">Cadastro material</button><button data-q="Entra na Extrusão">Abrir Extrusão</button></div><div class="dfspBar"><div class="dfspListen" id="dfspListen">Toque no microfone para falar</div><div class="dfspCompose"><button class="dfspMic" id="dfspMic" aria-label="Falar">🎙</button><input class="dfspInput" id="dfspInput" placeholder="Fale ou digite o que quer fazer"><button class="dfspSend" id="dfspSend">ENVIAR</button></div></div>`;
 document.body.appendChild(panel);
 const fab=document.createElement('button');fab.id='dfSupportFab';fab.type='button';fab.setAttribute('aria-label','Abrir Assistente DF');fab.textContent='🎙';document.body.appendChild(fab);
 fab.onclick=()=>{open();if(!listening)toggleRec()};
 document.getElementById('dfspClose').onclick=close;
 document.getElementById('dfspMic').onclick=toggleRec;
 const send=()=>{const i=document.getElementById('dfspInput');const v=i.value;i.value='';ask(v,false)};
 document.getElementById('dfspSend').onclick=send;
 document.getElementById('dfspInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send()}});
 panel.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>ask(b.dataset.q,false));
}
window.DFAssistenteAoVivoV6={ensure,open,ask,appContext};
window.DFAssistenteSuporteV5=window.DFAssistenteAoVivoV6;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ensure,900));else setTimeout(ensure,900);
})();