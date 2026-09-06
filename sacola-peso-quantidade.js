(function(){
  'use strict';

  function $(id){return document.getElementById(id)}
  function num(v){
    let s=String(v??'').trim().replace(/\s/g,'');
    if(!s)return 0;
    if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(',','.');
    const n=parseFloat(s);
    return Number.isFinite(n)?n:0;
  }
  function val(id){const e=$(id);return num(e?e.value:0)}
  function densidade(){
    const s=$('saDs');
    if(!s)return 0;
    return s.value==='manual'?val('saDm'):num(s.value);
  }
  function fmt(v,d=0){
    const n=Number(v);
    return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
  }

  let timer=0;
  function debounce(){clearTimeout(timer);timer=setTimeout(calcular,180)}

  async function calcular(){
    const pesoAlvo=val('saPesoAlvo');
    const out=$('saQtdPorPeso');
    const st=$('saQtdPorPesoInfo');
    if(!out)return;

    if(!(pesoAlvo>0)){
      out.textContent='—';
      if(st)st.textContent='';
      return;
    }

    if(typeof window.dfCalc!=='function'){
      out.textContent='—';
      if(st){st.textContent='A calculadora ainda está carregando.';st.className='status warn'}
      return;
    }

    try{
      const r=await window.dfCalc('sacola',{
        largura:val('saL'),
        comprimento:val('saC'),
        micra:val('saM'),
        densidade:densidade(),
        descontoPct:val('saDes'),
        quantidade:0
      });
      const pesoUnidade=Number(r&&r.pesoUnidade)||0;
      if(!(pesoUnidade>0)){
        out.textContent='—';
        if(st){st.textContent='Preencha largura, comprimento, micra e densidade.';st.className='status warn'}
        return;
      }

      const qtd=Math.max(1,Math.round((pesoAlvo*1000)/pesoUnidade));
      const pesoEstimado=(qtd*pesoUnidade)/1000;
      out.textContent=fmt(qtd,0)+' sacos';
      if(st){
        st.textContent='Peso estimado com '+fmt(qtd,0)+' sacos: '+fmt(pesoEstimado,3)+' kg';
        st.className='status ok';
      }
    }catch(e){
      out.textContent='—';
      if(st){st.textContent='Não foi possível calcular agora.';st.className='status warn'}
    }
  }

  function montar(){
    if($('saPesoAlvo'))return;
    const q=$('saQ');
    const card=q&&q.closest('.card');
    if(!card)return;

    const box=document.createElement('div');
    box.id='saPesoQtdExtra';
    box.innerHTML='\
      <label>Peso desejado do rolo (kg)</label>\
      <input id="saPesoAlvo" class="main" inputmode="decimal" placeholder="Ex.: 6">\
      <div class="result">\
        <span>QUANTIDADE DE SACOS PELO PESO</span>\
        <b id="saQtdPorPeso">—</b>\
        <div id="saQtdPorPesoInfo" class="status"></div>\
      </div>';
    card.appendChild(box);

    $('saPesoAlvo')?.addEventListener('input',debounce);
    ['saL','saC','saM','saDes','saDm'].forEach(id=>$(id)?.addEventListener('input',debounce));
    $('saDs')?.addEventListener('change',debounce);
  }

  function init(){
    montar();
    setTimeout(montar,300);
    setTimeout(montar,1000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
