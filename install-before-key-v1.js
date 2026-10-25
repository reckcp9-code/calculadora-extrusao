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
 box.style.cssText='position:fixed;right:12px;bottom:calc(env(safe-area-inset-bottom, 0px) + 12px);z-index:999999;width:min(280px,calc(100vw - 24px));margin:0;padding:9px 10px;border:1px solid #334766;border-radius:12px;background:#101e33;color:#cbd5e1;text-align:left;box-sizing:border-box;font:500 13px/1.5 system-ui,-apple-system,sans-serif;box-shadow:0 4px 18px #0002';
 const inApp=/WhatsApp|FBAN|FBAV|Instagram/i.test(ua);
 const subtitle=ios?'Instale na tela inicial para abrir como aplicativo.':'Instale para acessar direto pela tela inicial.';
 const steps=ios?'<b>1.</b> Abra no Safari'+(inApp?' pelo menu deste navegador':'')+'.<br><b>2.</b> Toque em Compartilhar → Adicionar à Tela de Início.<br><b>3.</b> Abra o ícone e digite sua KEY.':'No Chrome, use Instalar aplicativo. Se não aparecer, abra o menu ⋮ e selecione Adicionar à tela inicial.';
 box.innerHTML='<div style="display:flex;align-items:center;gap:10px"><span style="font-size:16px">📲</span><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:800;color:#dbeafe">Instalar DF Extrusor Pro</div><div style="font-size:11px;color:#94a3b8">'+subtitle+'</div></div><button type="button" id="dfInstallSkip" aria-label="Fechar orientação" style="border:0;background:transparent;color:#94a3b8;font-size:22px;padding:0 4px;cursor:pointer">×</button></div>'+
 '<div id="dfInstallDetails" hidden style="margin-top:12px;padding:11px 12px;border-radius:10px;background:#0b1425;color:#cbd5e1;font-size:13px;line-height:1.8">'+steps+'</div>'+
 '<button type="button" id="dfInstallAction" style="width:100%;margin-top:8px;padding:8px 10px;border:1px solid #315b96;border-radius:10px;background:#162c4c;color:#bfdbfe;font-weight:750;font-size:13px;cursor:pointer">'+(android?'INSTALAR APLICATIVO':'VER COMO INSTALAR')+'</button>';
 document.body.appendChild(box);
 box.querySelector('#dfInstallAction').onclick=async()=>{
   if(android&&promptEvent){const e=promptEvent;promptEvent=null;try{await e.prompt();await e.userChoice}catch(_){}return}
   const details=box.querySelector('#dfInstallDetails'),btn=box.querySelector('#dfInstallAction');
   details.hidden=!details.hidden;
   btn.textContent=details.hidden?(android?'INSTALAR APLICATIVO':'VER COMO INSTALAR'):'OCULTAR INSTRUÇÕES';
 };
 box.querySelector('#dfInstallSkip').onclick=()=>{sessionStorage.setItem('dfInstallGuideSkipped','1');box.remove()};
}
document.addEventListener('DOMContentLoaded',render);
window.addEventListener('df-ui-ready',render);
window.addEventListener('df-auth-ready',()=>document.getElementById('dfInstallGuide')?.remove());
setTimeout(render,700);
setInterval(render,3000);
})();