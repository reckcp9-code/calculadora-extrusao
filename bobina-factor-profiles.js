(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const KEY_LISA='df_bobina_fator_lisa_v1';
  const KEY_SANF='df_bobina_fator_sanfonada_v1';
  let currentType='';
  let mounted=false;

  function num(v){
    const n=parseFloat(String(v||'').trim().replace(',','.').replace(/[^0-9.\-]/g,''));
    return Number.isFinite(n)?n:0;
  }
  function fmt(v){return Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2})}
  function tipo(){return $('bobTipo')?.value==='sanfonada'?'sanfonada':'lisa'}
  function key(t){return t==='sanfonada'?KEY_SANF:KEY_LISA}
  function ler(t){
    try{const v=num(localStorage.getItem(key(t)));if(v>0)return v}catch(e){}
    return 100;
  }
  function salvar(t,v){
    if(!(v>0))return;
    try{localStorage.setItem(key(t),String(v))}catch(e){}
  }
  function migrar(){
    const k=$('bobK');
    if(!k)return;
    try{
      if(!localStorage.getItem(KEY_LISA))salvar('lisa',num(k.value)||100);
      if(!localStorage.getItem(KEY_SANF))salvar('sanfonada',100);
    }catch(e){}
  }
  function nota(){
    let n=$('dfBobinaPerfis');
    if(!n){
      const k=$('bobK');
      if(!k)return null;
      n=document.createElement('div');
      n.id='dfBobinaPerfis';
      n.className='smallNote';
      n.style.marginTop='7px';
      k.insertAdjacentElement('afterend',n);
    }
    return n;
  }
  function atualizarTela(){
    const t=tipo(),k=$('bobK');
    if(!k)return;
    const lab=k.parentElement?.querySelector('label');
    if(lab)lab.textContent=t==='sanfonada'?'Fator calibrado — SANFONADA (%)':'Fator calibrado — LISA (%)';
    const n=nota();
    if(n)n.textContent='Salvo neste aparelho: Lisa '+fmt(ler('lisa'))+'% • Sanfonada '+fmt(ler('sanfonada'))+'%. Ao trocar o tipo, o app usa o fator correspondente automaticamente.';
  }
  function aplicarTipo(novo){
    const k=$('bobK');if(!k)return;
    if(currentType&&currentType!==novo)salvar(currentType,num(k.value));
    currentType=novo;
    k.value=fmt(ler(novo));
    atualizarTela();
    k.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function mount(){
    const k=$('bobK'),sel=$('bobTipo');
    if(!k||!sel)return;
    migrar();
    if(!mounted){
      mounted=true;
      currentType=tipo();
      k.value=fmt(ler(currentType));

      sel.addEventListener('change',()=>aplicarTipo(tipo()));
      const guardar=()=>{const t=tipo();currentType=t;salvar(t,num(k.value));atualizarTela()};
      k.addEventListener('input',guardar);
      k.addEventListener('change',guardar);

      document.addEventListener('click',e=>{
        if(e.target?.closest?.('#bobCalBtn')){
          const t=tipo();
          setTimeout(()=>{
            const v=num($('bobK')?.value);
            if(v>0){salvar(t,v);currentType=t;atualizarTela()}
          },30);
        }
      },true);
    }
    atualizarTela();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,250),{once:true});else setTimeout(mount,250);
  window.addEventListener('df-ui-ready',()=>setTimeout(mount,350));
  const mo=new MutationObserver(()=>{if(!mounted||!$('dfBobinaPerfis'))requestAnimationFrame(mount)});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(mount,700);
  setTimeout(mount,1400);
})();
