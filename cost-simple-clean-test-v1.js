(function(){
  'use strict';
  if(window.DFCostSimpleCleanTestV1)return;
  window.DFCostSimpleCleanTestV1=true;

  const $=id=>document.getElementById(id);

  function clean(){
    const pg=$('pgCu');
    const box=$('dfCostUltra');
    if(!pg||!box)return false;

    // Mantém somente a interface simples já combinada.
    pg.classList.add('df-cost-ultra');
    pg.classList.remove('df-cost-full');

    const fullBtn=$('dfCuCompleto');
    if(fullBtn)fullBtn.remove();

    // Remove qualquer acesso residual ao cálculo completo e impede que cartões antigos reapareçam.
    Array.from(pg.children).forEach(function(child){
      if(child!==box && child.classList && child.classList.contains('card')){
        child.style.display='none';
        child.setAttribute('aria-hidden','true');
      }
    });

    const styleId='dfCostSimpleCleanTestV1Style';
    if(!$(styleId)){
      const s=document.createElement('style');
      s.id=styleId;
      s.textContent=`
        #pgCu.df-cost-ultra > .card{display:none!important}
        #pgCu.df-cost-ultra > #dfCostUltra{display:block!important}
        #dfCuCompleto{display:none!important}
      `;
      document.head.appendChild(s);
    }
    return true;
  }

  function start(){
    if(clean())return;
    let tries=0;
    const t=setInterval(function(){tries++;if(clean()||tries>40)clearInterval(t)},100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',function(){setTimeout(clean,250);setTimeout(clean,900)},{once:true});
})();
