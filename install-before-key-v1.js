(function(){
'use strict';
if(window.DFInstallGuide)return;window.DFInstallGuide=true;
const ua=navigator.userAgent||'',ios=/iPhone|iPad|iPod/i.test(ua),android=/Android/i.test(ua);
if(!ios&&!android)return;
let promptEvent=null,installed=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;render()});
window.addEventListener('appinstalled',()=>{installed=true;document.getElementById('dfInstallGuide')?.remove()});
function render(){
 const gate=document.getElementById('licenseGate');
 if(!gate||installed||document.documentElement.classList.contains('df-access-restoring')||gate.style.display==='none'){document.getElementById('dfInstallGuide')?.remove();return}
 if(sessionStorage.getItem('dfInstallGuideSkipped')==='1')return;
 let box=document.getElementById('dfInstallGuide');
 if(box)return;
 box=document.createElement('section');box.id='dfInstallGuide';
 box.style.cssText='width:100%;max-width:680px;margin:0 auto 22px;padding:18px;border:1px solid #2563eb;border-radius:16px;background:#0e1e38;color:#e2e8f0;text-align:left;box-sizing:border-box;font:500 15px/1.6 system-ui,-apple-system,sans-serif';
 const inApp=/WhatsApp|FBAN|FBAV|Instagram/i.test(ua);
 box.innerHTML='<strong style="display:block;color:#93c5fd;font-size:19px;margin-bottom:8px">📲 INSTALE O DF EXTRUSOR PRO</strong>'+
 (ios?'<div><b>iPhone:</b> '+(inApp?'Abra este link no Safari pelo menu do WhatsApp. ':'')+'No Safari, toque em <b>Compartilhar</b> (quadrado com seta para cima), depois em <b>Adicionar à Tela de Início</b> e confirme <b>Adicionar</b>. Abra o ícone do aplicativo e digite sua KEY.</div>':
 '<div><b>Android:</b> toque em INSTALAR APLICATIVO. Se o navegador não oferecer a instalação, abra o menu ⋮ do Chrome e escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>. Depois abra o aplicativo e digite sua KEY.</div>')+
 '<button type="button" id="dfInstallAction" style="width:100%;margin-top:12px;padding:14px;border:1px solid #f59e0b;border-radius:12px;background:#302008;color:#fcd34d;font-weight:800">'+(android?'📲 INSTALAR APLICATIVO':'📤 VER COMO INSTALAR NO IPHONE')+'</button>'+
 '<button type="button" id="dfInstallSkip" style="width:100%;margin-top:8px;padding:10px;border:1px solid #334155;border-radius:10px;background:#14243e;color:#cbd5e1;font-weight:700">CONTINUAR NO NAVEGADOR</button><div id="dfInstallHint" style="color:#93c5fd;font-size:13px;margin-top:8px"></div>';
 gate.insertBefore(box,gate.firstChild);
 box.querySelector('#dfInstallAction').onclick=async()=>{
 const hint=box.querySelector('#dfInstallHint');
 if(android&&promptEvent){const e=promptEvent;promptEvent=null;try{await e.prompt();await e.userChoice}catch(_){}return}
 hint.textContent=ios?'No Safari: Compartilhar → Adicionar à Tela de Início. Em navegadores internos, abra primeiro no Safari.':'No Chrome: menu ⋮ → Instalar aplicativo.';
 };
 box.querySelector('#dfInstallSkip').onclick=()=>{sessionStorage.setItem('dfInstallGuideSkipped','1');box.remove()};
}
document.addEventListener('DOMContentLoaded',render);
window.addEventListener('df-ui-ready',render);
window.addEventListener('df-auth-ready',()=>document.getElementById('dfInstallGuide')?.remove());
setTimeout(render,700);
setInterval(render,3000);
})();