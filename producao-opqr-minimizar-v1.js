(function(){
'use strict';
if(window.DF_PRODUCAO_OPQR_MINIMIZAR_V1)return;window.DF_PRODUCAO_OPQR_MINIMIZAR_V1=true;
const KEY='df_producao_opqr_minimizado_v1';
function read(){try{return localStorage.getItem(KEY)==='1'}catch(e){return false}}
function write(v){try{localStorage.setItem(KEY,v?'1':'0')}catch(e){}}
function ensureStyle(){if(document.getElementById('dfProdOpQrMinCss'))return;const s=document.createElement('style');s.id='dfProdOpQrMinCss';s.textContent=`
.dfPAHero{position:relative}.dfPAHero h2{padding-right:128px}.dfPAOpQrMinBtn{position:absolute;top:12px;right:12px;border:1px solid #3b82f6;background:#10244a;color:#bfdbfe;border-radius:11px;padding:9px 11px;font:900 10px/1 system-ui;letter-spacing:.2px}.dfPAOpQrMinBtn:active{transform:scale(.98)}
#dfProdAuto.dfPAOpQrMinimized .dfPAHero p,#dfProdAuto.dfPAOpQrMinimized .dfPAHealth,#dfProdAuto.dfPAOpQrMinimized #dfProdTeamV2{display:none!important}
#dfProdAuto.dfPAOpQrMinimized .dfPAHero{padding:14px 16px;margin-bottom:10px;min-height:54px;display:flex;align-items:center}
#dfProdAuto.dfPAOpQrMinimized .dfPAHero h2{margin:0;padding-right:130px}
@media(max-width:520px){.dfPAOpQrMinBtn{top:11px;right:10px;padding:9px 10px;font-size:9px}.dfPAHero h2{padding-right:118px}}
`;document.head.appendChild(s)}
function apply(){const root=document.getElementById('dfProdAuto'),hero=root&&root.querySelector('.dfPAHero');if(!root||!hero)return false;ensureStyle();let b=hero.querySelector('.dfPAOpQrMinBtn');if(!b){b=document.createElement('button');b.type='button';b.className='dfPAOpQrMinBtn';b.setAttribute('aria-expanded','true');hero.appendChild(b);b.addEventListener('click',()=>{const next=!root.classList.contains('dfPAOpQrMinimized');root.classList.toggle('dfPAOpQrMinimized',next);write(next);paint(root,b)})}const minimized=read();root.classList.toggle('dfPAOpQrMinimized',minimized);paint(root,b);return true}
function paint(root,b){const min=root.classList.contains('dfPAOpQrMinimized');b.textContent=min?'EXPANDIR ▼':'MINIMIZAR ▲';b.setAttribute('aria-expanded',min?'false':'true')}
function boot(){let tries=0;const t=setInterval(()=>{if(apply()||++tries>80)clearInterval(t)},120);const mo=new MutationObserver(()=>requestAnimationFrame(apply));mo.observe(document.documentElement,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
