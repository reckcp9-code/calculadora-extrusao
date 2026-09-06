(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const num=v=>window.parseNum?window.parseNum(v):(parseFloat(String(v||'').replace(',','.'))||0);
  const get=id=>num($(id)?.value);
  const rs=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  let timer=0,bound=false,observer=null;

  function densidade(){
    const s=$('saDs');
    if(!s)return 0;
    return s.value==='manual'?get('saDm'):num(s.value);
  }
  function modo(){return $('cuLucroModo')?.value||localStorage.getItem('df_custo_lucro_modo_v1')||'markup'}
  function precoVenda(custo,pct){
    if(modo()==='margin'){
      if(!(pct>=0&&pct<100))return NaN;
      return custo/(1-pct/100);
    }
    return custo*(1+pct/100);
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(recalc,260);
  }

  async function recalc(){
    const auto=$('cuAuto');
    if(!auto||!auto.checked)return;
    if(typeof window.dfCalc!=='function')return;
    const custoKg=get('cuKg');
    if(!(custoKg>0))return;

    try{
      const r=await window.dfCalc('sacola',{
        largura:get('saL'),
        comprimento:get('saC'),
        micra:get('saM'),
        densidade:densidade(),
        descontoPct:get('saDes'),
        quantidade:0
      });
      const pesoUnidadeG=Number(r&&r.pesoUnidade)||0;
      if(!(pesoUnidadeG>0))return;

      const lucroPct=get('cuLucroPct');
      const custoUnidade=(pesoUnidadeG/1000)*custoKg;
      const vendaUnidade=precoVenda(custoUnidade,lucroPct);

      const custoEl=$('cuCustoUnid');
      const vendaEl=$('cuPrecoUnid');
      if(custoEl)custoEl.textContent=rs(custoUnidade);
      if(vendaEl)vendaEl.textContent=Number.isFinite(vendaUnidade)?rs(vendaUnidade):'—';
    }catch(e){
      console.warn('DF custo por unidade estável:',e);
    }
  }

  function bind(){
    const pg=$('pgCu');
    if(!pg)return false;
    if(!bound){
      bound=true;
      ['cuKg','cuLucroPct','cuLucroModo','cuAuto','saL','saC','saM','saDes','saDm','saPesoAlvo','saQ'].forEach(id=>{
        const e=$(id);
        e?.addEventListener('input',()=>setTimeout(schedule,40));
        e?.addEventListener('change',()=>setTimeout(schedule,40));
      });
      $('saDs')?.addEventListener('change',()=>setTimeout(schedule,40));
      window.addEventListener('hashchange',schedule);
      window.addEventListener('focus',schedule);
    }

    if(!observer){
      const alvo=$('cuCustoRolo');
      if(alvo){
        observer=new MutationObserver(()=>schedule());
        observer.observe(alvo,{childList:true,characterData:true,subtree:true});
      }
    }
    schedule();
    return true;
  }

  function init(){
    if(!bind())setTimeout(init,300);
    setTimeout(bind,700);
    setTimeout(bind,1600);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
