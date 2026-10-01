(function(){
'use strict';
if(window.DFVoiceAssistantV3){try{window.DFVoiceAssistantV3.ensure()}catch(e){}return;}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,wanted=false,running=false,restartTimer=null,pending=null,lastFinal='',lastFinalAt=0;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9%.,+\- ]/g,' ').replace(/\s+/g,' ').trim();
const visible=e=>{if(!e||!e.isConnected)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
function toast(t,bad){let x=document.getElementById('dfv3Toast');if(!x){x=document.createElement('div');x.id='dfv3Toast';document.body.appendChild(x)}x.textContent=t;x.className=bad?'bad':'';clearTimeout(x._t);x._t=setTimeout(()=>x.remove(),2600)}
function setState(on){const f=document.getElementById('dfVoiceFabV3');if(f){f.classList.toggle('on',!!on);f.setAttribute('aria-pressed',on?'true':'false');f.setAttribute('aria-label',on?'Assistente DF ouvindo. Toque para parar.':'Ativar Assistente DF por voz.');f.title=on?'Ouvindo — toque para parar':'Ativar Assistente DF'}}
function label(e){let t=(e.id||'')+' '+(e.name||'')+' '+(e.placeholder||'')+' '+(e.getAttribute('aria-label')||'');try{const l=e.id&&document.querySelector('label[for="'+CSS.escape(e.id)+'"]');if(l)t+=' '+l.textContent;const p=e.closest('.card,.formRow,.savedItem,div');const q=p&&p.querySelector('label');if(q)t+=' '+q.textContent}catch(_){}return norm(t)}
function score(a,b){a=norm(a);b=norm(b);if(!a||!b)return 0;if(a===b)return 100;if(a.includes(b)||b.includes(a))return 72;let n=0;const aa=a.split(' ');for(const w of b.split(' '))if(w.length>1&&aa.some(x=>x===w||x.startsWith(w)||w.startsWith(x)))n++;return n*15}
function fields(){return [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(visible).filter(e=>e.id!=='dfv3Hidden')}
function buttons(){return [...document.querySelectorAll('button,a,[role=button]')].filter(visible).filter(e=>e.id!=='dfVoiceFabV3')}
function bestButton(q){let best=null,bs=0;for(const b of buttons()){const s=score((b.textContent||'')+' '+(b.id||'')+' '+(b.getAttribute('aria-label')||''),q);if(s>bs){bs=s;best=b}}return bs>=15?best:null}
const areaDefs=[
 {name:'formulação',key:'formulacao',aliases:['formulacao','formulaçao','formulação']},
 {name:'extrusão',key:'extrusao',aliases:['extrusao','extrusão','abstrusao','abstrusão','extrusora']},
 {name:'sacolas',key:'sacola',aliases:['sacola','sacolas','sacaria']},
 {name:'custo',key:'custo',aliases:['custo','custos']},
 {name:'OP',key:'op',aliases:['ordem de producao','op']}
];
function requestedArea(q){const n=norm(q);let hit=null,pos=-1;for(const a of areaDefs)for(const al of a.aliases){const p=n.lastIndexOf(norm(al));if(p>pos){pos=p;hit=a}}return hit}
function openArea(q,silent){const a=requestedArea(q);if(!a)return false;const b=bestButton(a.key)||bestButton(a.name);if(!b)return false;b.click();if(!silent)toast('Abrindo '+a.name);return true}
function setFieldValue(f,v){if(!f)return false;if(f.tagName==='SELECT'){let o=[...f.options].sort((a,b)=>score(b.textContent,v)-score(a.textContent,v))[0];if(!o||score(o.textContent,v)<15)return false;f.value=o.value}else{let val=String(v).trim();if(f.type==='number'||f.inputMode==='decimal'){const m=val.match(/[+\-]?\d+(?:[.,]\d+)?/);if(m)val=m[0].replace(',','.')}f.value=val}f.dispatchEvent(new Event('input',{bubbles:true}));f.dispatchEvent(new Event('change',{bubbles:true}));return true}
function fillByAliases(aliases,value){let best=null,bs=0;for(const f of fields()){for(const a of aliases){const s=score(label(f),a);if(s>bs){bs=s;best=f}}}return bs>=25&&setFieldValue(best,value)}
function fill(q){const n=norm(q).replace(/^(colocar|preencher|definir|mudar|alterar|informar|faz|fazer)\s+/,'');const parts=n.split(' ');let best=null;for(const f of fields())for(let i=1;i<Math.min(parts.length,7);i++){const k=parts.slice(0,i).join(' '),v=parts.slice(i).join(' '),s=score(label(f),k);if(v&&s>=30&&(!best||s>best.s))best={f,k,v,s}}if(!best)return false;if(!setFieldValue(best.f,best.v))return false;best.f.scrollIntoView({behavior:'smooth',block:'center'});toast(best.k+' = '+best.v);return true}
function sacolaSize(q){const n=norm(q);if(!/sacola|sacolas|sacaria/.test(n))return false;const m=n.match(/(\d+(?:[.,]\d+)?)\s*(?:x|por)\s*(\d+(?:[.,]\d+)?)/);if(!m)return false;openArea('sacola',true);const w=m[1],h=m[2];setTimeout(()=>{const ok1=fillByAliases(['largura','boca'],w);const ok2=fillByAliases(['comprimento','altura','tamanho'],h);toast(ok1&&ok2?'Sacola '+w+' × '+h+' preenchida':'Abri Sacolas. Complete os campos que faltarem.',!(ok1||ok2))},420);return true}
function stopPhrase(n){return /(?:pode\s+)?(?:encerrar|parar|desligar|finalizar)\s+(?:o\s+)?assistente/.test(n)||/assistente\s+(?:pode\s+)?(?:encerrar|parar|desligar|finalizar)/.test(n)}
function command(raw){const q=String(raw||'').trim();if(!q)return;const n=norm(q);if(stopPhrase(n)){stop(true);toast('Assistente encerrado');return}
 if(/^(confirmar|confirmo|pode confirmar)$/.test(n)){if(pending&&pending.isConnected){const b=pending;pending=null;b.click();toast('Confirmado');return}toast('Nada aguardando confirmação');return}
 if(sacolaSize(q))return;
 if(openArea(q))return;
 if(/^(salvar|excluir|apagar|concluir|finalizar|gerar op|criar op)/.test(n)){const b=bestButton(q);if(b){pending=b;toast('Diga “confirmar” para '+(b.textContent||q));return}}
 if(fill(q))return;
 const b=bestButton(q);if(b){b.click();toast('Executando '+q);return}
 toast('Não entendi: '+q,true)
}
function createRecognition(){if(!SR)return null;const r=new SR();r.lang='pt-BR';r.interimResults=true;r.continuous=true;r.maxAlternatives=1;
 r.onstart=()=>{running=true;setState(true)};
 r.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const text=(e.results[i][0]&&e.results[i][0].transcript||'').trim();if(!text)continue;if(e.results[i].isFinal){const now=Date.now();if(text!==lastFinal||now-lastFinalAt>1800){lastFinal=text;lastFinalAt=now;command(text)}}else interim+=text+' '}if(interim)document.getElementById('dfVoiceFabV3')?.setAttribute('data-heard',interim.trim())};
 r.onerror=e=>{running=false;if(e.error==='not-allowed'||e.error==='service-not-allowed'){wanted=false;setState(false);toast('Permita o microfone para usar o Assistente DF.',true)}else if(e.error==='audio-capture'){wanted=false;setState(false);toast('Não encontrei o microfone.',true)}else if(e.error!=='aborted'&&e.error!=='no-speech'){console.debug('DF Voice:',e.error)}};
 r.onend=()=>{running=false;if(wanted){clearTimeout(restartTimer);restartTimer=setTimeout(()=>{if(wanted)beginRecognition()},220)}else setState(false)};
 return r
}
function beginRecognition(){if(!wanted||running)return;if(!SR){wanted=false;setState(false);toast('Reconhecimento de voz não disponível neste navegador.',true);return}try{if(!rec)rec=createRecognition();rec.start()}catch(e){clearTimeout(restartTimer);restartTimer=setTimeout(()=>{if(wanted){try{rec=null;beginRecognition()}catch(_){}}},450)}}
function start(){ensure();if(wanted)return;wanted=true;setState(true);toast('Assistente ativo — estou ouvindo.');beginRecognition()}
function stop(fromVoice){wanted=false;clearTimeout(restartTimer);setState(false);try{rec&&rec.abort()}catch(_){}running=false;if(!fromVoice)toast('Assistente pausado')}
function toggle(){wanted?stop(false):start()}
function ensure(){if(!document.body)return;document.getElementById('dfVoicePanelV2')?.remove();document.getElementById('dfVoiceFabV2')?.remove();document.getElementById('dfVoiceStyleV2')?.remove();let f=document.getElementById('dfVoiceFabV3');if(!f){f=document.createElement('button');f.id='dfVoiceFabV3';f.type='button';f.innerHTML='<span aria-hidden="true">🎙️</span>';f.setAttribute('aria-label','Ativar Assistente DF por voz.');f.setAttribute('aria-pressed','false');f.onclick=toggle;document.body.appendChild(f)}
 if(!document.getElementById('dfVoiceStyleV3')){const s=document.createElement('style');s.id='dfVoiceStyleV3';s.textContent=`#dfVoiceFabV3{position:fixed!important;right:18px!important;bottom:94px!important;z-index:2147483000!important;width:48px!important;height:48px!important;padding:0!important;border:1.5px solid #f5a000!important;background:#171006!important;color:#ffd36a!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;box-shadow:0 8px 24px #0009!important;font:900 22px system-ui!important;-webkit-tap-highlight-color:transparent!important;transition:transform .15s,box-shadow .15s,background .15s!important}#dfVoiceFabV3:active{transform:scale(.94)!important}#dfVoiceFabV3.on{background:#2a1900!important;box-shadow:0 0 0 5px #f5a00035,0 0 22px #f5a00066,0 8px 24px #0009!important;animation:dfv3pulse 1.25s ease-in-out infinite!important}#dfVoiceFabV3.on span{filter:drop-shadow(0 0 5px #ffd36a)}@keyframes dfv3pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}#dfv3Toast{position:fixed;right:76px;bottom:100px;z-index:2147483002;background:#102719;border:1px solid #2e7d4f;color:#c8f7d7;border-radius:11px;padding:9px 11px;font:800 12px system-ui;max-width:min(70vw,320px);box-shadow:0 10px 30px #0009}#dfv3Toast.bad{background:#2b1010;border-color:#8f3030;color:#fecaca}@media(max-width:520px){#dfVoiceFabV3{right:14px!important;bottom:92px!important;width:46px!important;height:46px!important;font-size:21px!important}#dfv3Toast{right:68px;bottom:98px}}`;document.head.appendChild(s)}setState(wanted)}
window.DFVoiceAssistantV3={ensure,start,stop,toggle,command,get active(){return wanted}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
[400,1200,3000,6500].forEach(t=>setTimeout(ensure,t));window.addEventListener('pageshow',ensure);window.addEventListener('df-ui-ready',ensure);
})();