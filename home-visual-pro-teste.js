(function () {
  'use strict';
  const asset = new URL('./df-home-visual-pro.png', document.currentScript.src).href;
  const modules = [
    ['btEx', 'EX', 'EXTRUSÃO', 'Micra • peso/m • processo', 'ex'],
    ['btFo', 'FO', 'FORMULAÇÃO', 'Misturas • OP • PDF', 'fo'],
    ['btSa', 'SA', 'SACOLAS', 'Medidas • produção', 'sa'],
    ['btCu', 'R$', 'CUSTO', 'Preço • margem • kg', 'cu']
  ];
  function mount() {
    const app = document.getElementById('appContent');
    if (!app || document.getElementById('dfProHome')) return;
    const style = document.createElement('style');
    style.textContent = `
      #dfProHome{--gold:#efbc53;--muted:#a0adc0;color:#f8fafc;margin:0 0 20px;isolation:isolate}
      body:not(.dfSectionMode) #appContent>.brand,body:not(.dfSectionMode) #appContent>.tabs,body:not(.dfSectionMode) #dfQuickAccess,body:not(.dfSectionMode) #dfBetaApp,body:not(.dfSectionMode) #dfSystemBar{display:none!important}
      body.dfSectionMode #dfProHome{display:none!important}
      #dfProHome *{box-sizing:border-box}
      #dfProHome button,#dfProHome summary{font:inherit;cursor:pointer}
      #dfProHome button:focus-visible,#dfProHome summary:focus-visible{outline:3px solid #fff;outline-offset:4px}
      #dfProHome .proHero{overflow:hidden;border-radius:22px;border:1px solid #2c394b;background:#070d15;text-align:center;box-shadow:0 18px 48px #0005}
      #dfProHome .proArtwork{width:100%;aspect-ratio:853/410;background-image:url('${asset}');background-size:100% auto;background-position:center top;background-repeat:no-repeat}
      #dfProHome .proHeading{padding:10px 18px 24px;background:linear-gradient(#080e16,#0b121c)}
      #dfProHome .proTag{display:inline-block;padding:7px 14px;border:1px solid #a47a2b;border-radius:999px;color:#f8d583;font-size:12px;font-weight:800;letter-spacing:.06em}
      #dfProHome h1{font-size:clamp(25px,5vw,40px);line-height:1.15;margin:16px 0 8px;letter-spacing:-.7px}
      #dfProHome .proSubtitle{margin:0 auto;color:var(--muted);font-size:12px;line-height:1.5;font-weight:700;letter-spacing:.035em;max-width:560px}
      #dfProHome .proSectionTitle{margin:24px 2px 4px;font-size:23px;letter-spacing:-.5px}
      #dfProHome .proSectionHint{margin:0 2px 16px;color:var(--muted);font-size:14px}
      #dfProHome .proGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      #dfProHome .proModule{position:relative;overflow:hidden;min-height:188px;text-align:left;border:1.5px solid var(--gold);border-radius:20px;padding:17px 14px;background:radial-gradient(ellipse at 80% 20%,#182b3b,#0a1420 72%);color:#f8fafc;box-shadow:0 8px 25px #0003;transition:transform .15s,border-color .15s}
      #dfProHome .proModule:hover{transform:translateY(-2px);border-color:#ffda87}
      #dfProHome .proModule:active{transform:scale(.98)}
      #dfProHome .proCode{display:grid;place-items:center;position:relative;z-index:2;width:43px;height:40px;background:#09121ce8;border:1px solid #ddb353;border-radius:10px;color:#f2c765;font-size:14px;font-weight:850;letter-spacing:.08em}
      #dfProHome .proModuleText{position:relative;z-index:2;display:block;margin-top:57px}
      #dfProHome .proModule strong{display:block;font-size:clamp(16px,3.3vw,22px);line-height:1.2;font-weight:850;letter-spacing:.01em}
      #dfProHome .proModule small{display:block;color:#abb8ca;font-size:12px;line-height:1.45;margin-top:6px;max-width:150px}
      #dfProHome .proIllustration{position:absolute;right:6px;top:8px;width:112px;height:117px;background-image:url('${asset}');background-repeat:no-repeat;background-size:469px 1014px;pointer-events:none;mask-image:linear-gradient(#000 80%,transparent);-webkit-mask-image:linear-gradient(#000 80%,transparent)}
      #dfProHome .proIllustration.ex{background-position:-122px -422px}
      #dfProHome .proIllustration.fo{background-position:-302px -422px}
      #dfProHome .proIllustration.sa{background-position:-100px -609px}
      #dfProHome .proIllustration.cu{background-position:-307px -614px}
      #dfProHome .proBeta,#dfProHome .proMore{border:1px solid #314257;border-radius:15px;background:linear-gradient(135deg,#111c2a,#0a121d);margin-top:16px}
      #dfProHome summary{padding:15px 14px;font-size:12px;font-weight:800;letter-spacing:.03em;color:#dce4ef;min-height:48px}
      #dfProHome .proBeta p{padding:0 14px 14px;margin:0;color:var(--muted);font-size:14px;line-height:1.5}
      #dfProHome .proSystem{margin-top:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:13px;border:1px solid #314257;border-radius:15px;background:#0d1723}
      #dfProHome .proVersion{font-size:11px;letter-spacing:.025em;font-weight:750;flex:1 1 155px;color:#c6d0df}
      #dfProHome .proNet{font-size:11px;font-weight:800;border:1px solid #3a4b60;border-radius:999px;padding:10px;color:#d5deea;white-space:nowrap}
      #dfProHome .proNet::before{content:'';display:inline-block;width:7px;height:7px;margin-right:6px;background:#22c875;border-radius:50%}
      #dfProHome .proNet.off::before{background:#f5b94a}
      #dfProHome .proRefresh{font-size:11px;font-weight:800;padding:10px;color:#edcc80;border:1px solid #9f7b33;border-radius:10px;background:#151a20;min-height:38px}
      #dfProHome .proExtraGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 12px 12px}
      #dfProHome .proExtraGrid button{border:1px solid #33465e;border-radius:10px;background:#101c2b;color:#e5edf7;padding:12px;font-size:14px}
      #dfProHome .proTestLabel{text-align:center;color:#9daabf;font-size:11px;margin-top:14px;letter-spacing:.12em}
      @media(min-width:700px){#dfProHome .proArtwork{aspect-ratio:853/350}#dfProHome .proModule{min-height:218px;padding:22px}#dfProHome .proIllustration{right:25px;top:20px}#dfProHome .proModuleText{margin-top:68px}#dfProHome .proModule small{max-width:none;font-size:14px}}
      @media(max-width:370px){#dfProHome .proGrid{gap:9px}#dfProHome .proModule{padding:13px 10px}#dfProHome .proIllustration{right:-7px;opacity:.75}#dfProHome .proModule strong{font-size:15px}}
      @media(prefers-reduced-motion:reduce){#dfProHome .proModule{transition:none}}
    `;
    document.head.appendChild(style);
    const home = document.createElement('section');
    home.id = 'dfProHome';
    home.setAttribute('aria-label', 'Menu principal DF Extrusor Pro');
    home.innerHTML = `
      <div class="proHero"><div class="proArtwork" role="img" aria-label="DF Manutenção e Consultoria, extrusora e bobinas de filme"></div><div class="proHeading"><span class="proTag">USO EXCLUSIVO DF</span><h1>DF EXTRUSOR PRO</h1><p class="proSubtitle">CALCULADORA DE EXTRUSÃO • PESO POR METRO • MICRA • DENSIDADE</p></div></div>
      <h2 class="proSectionTitle">Funções principais</h2><p class="proSectionHint">Acesso direto aos módulos do sistema</p>
      <div class="proGrid">${modules.map(([id,code,title,desc,art]) => `<button class="proModule" type="button" data-pro-target="${id}" aria-label="Abrir ${title}"><span class="proCode" aria-hidden="true">${code}</span><span class="proIllustration ${art}" aria-hidden="true"></span><span class="proModuleText"><strong>${title}</strong><small>${desc}</small></span></button>`).join('')}</div>
      <details class="proBeta"><summary>🎁 PERÍODO BETA — ACESSO GRATUITO</summary><p>Use o DF EXTRUSOR PRO enquanto aperfeiçoamos o sistema.</p></details>
      <div class="proSystem"><span class="proVersion">DF EXTRUSOR PRO · TESTE VISUAL</span><span class="proNet" aria-live="polite"></span><button class="proRefresh" type="button" data-pro-refresh>↻ ATUALIZAR</button></div>
      <details class="proMore"><summary>MAIS OPÇÕES</summary><div class="proExtraGrid"><button type="button" data-pro-target="btAj">Ajuda</button><button type="button" data-pro-target="btFb">Feedback</button><button type="button" data-pro-target="dfFavBtn">Favoritos</button><button type="button" data-pro-course>Curso</button></div></details>
      <div class="proTestLabel">VERSÃO DE TESTE</div>`;
    app.prepend(home);
    home.addEventListener('click', function (event) {
      const target = event.target.closest('[data-pro-target]');
      if (target) document.getElementById(target.dataset.proTarget)?.click();
      if (event.target.closest('[data-pro-refresh]')) location.reload();
      if (event.target.closest('[data-pro-course]')) location.href = './curso.html';
    });
    function network() {
      const badge = home.querySelector('.proNet');
      badge.textContent = navigator.onLine ? 'ONLINE' : 'OFFLINE';
      badge.classList.toggle('off', !navigator.onLine);
    }
    network();
    window.addEventListener('online', network);
    window.addEventListener('offline', network);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
  window.addEventListener('df-ui-ready', mount);
})();
