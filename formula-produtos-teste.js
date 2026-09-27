(function(){
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  let produtos=[];

  function style(){
    if(document.getElementById('dfProdutoBuscaCss'))return;
    const st=document.createElement('style');
    st.id='dfProdutoBuscaCss';
    st.textContent='#dfProdutoBuscaWrap{position:relative}#dfProdutoLista{display:none;position:absolute;left:0;right:0;top:100%;z-index:999;background:#07111d;border:1px solid #36516c;border-radius:12px;max-height:300px;overflow:auto;box-shadow:0 18px 38px rgba(0,0,0,.45)}#dfProdutoLista.on{display:block}.dfProdutoOpcao{display:block;width:100%;text-align:left;background:#07111d;color:#fff;border:0;border-bottom:1px solid #24384c;padding:12px}.dfProdutoOpcao b{display:block}.dfProdutoOpcao span{display:block;color:#ffd36a;font-size:12px;margin-top:3px}.dfProdutoInfo{margin-top:8px;padding:10px 12px;border:1px solid #334155;border-radius:10px;background:#0b1422;color:#cbd5e1;font-size:12px}.dfProdutoInfo strong{color:#ffd36a}';
    document.head.appendChild(st);
  }

  function apply(inp,p){
    inp.value=p.nome;
    inp.dataset.produtoId=p.id;
    inp.dataset.produtoBoca=p.boca_largura;
    inp.dataset.produtoMicra=p.micra;
    let info=document.getElementById('dfProdutoInfo');
    if(!info){info=document.createElement('div');info.id='dfProdutoInfo';info.className='dfProdutoInfo';inp.parentElement.appendChild(info)}
    info.innerHTML='Boca/Largura: <strong>'+esc(p.boca_largura)+'</strong> &nbsp;•&nbsp; Micra: <strong>'+esc(p.micra)+'</strong>';
    const exL=document.getElementById('exL');
    const exM=document.getElementById('exM');
    if(exL){exL.value=String(p.boca_largura).replace('.',',');exL.dispatchEvent(new Event('input',{bubbles:true}))}
    if(exM){exM.value=String(p.micra).replace('.',',');exM.dispatchEvent(new Event('input',{bubbles:true}))}
    const list=document.getElementById('dfProdutoLista');
    if(list)list.classList.remove('on');
  }

  function render(inp){
    const list=document.getElementById('dfProdutoLista');if(!list)return;
    const q=norm(inp.value.trim());
    const arr=produtos.filter(p=>!q||norm(p.nome).includes(q)).slice(0,20);
    list.innerHTML=arr.length?arr.map((p,i)=>'<button type="button" class="dfProdutoOpcao" data-i="'+i+'"><b>'+esc(p.nome)+'</b><span>Boca/Largura '+esc(p.boca_largura)+' • Micra '+esc(p.micra)+'</span></button>').join(''):'<div style="padding:12px;color:#94a3b8;font-size:12px">Nenhum produto encontrado.</div>';
    list.dataset.ids=JSON.stringify(arr.map(p=>p.id));
    list.classList.add('on');
  }

  function bind(){
    const inp=document.getElementById('foNome');
    if(!inp||inp.dataset.dfProdutoBusca)return false;
    inp.dataset.dfProdutoBusca='1';
    inp.placeholder='Digite para buscar produto';
    const wrap=document.createElement('div');wrap.id='dfProdutoBuscaWrap';
    inp.parentNode.insertBefore(wrap,inp);wrap.appendChild(inp);
    const list=document.createElement('div');list.id='dfProdutoLista';wrap.appendChild(list);
    inp.addEventListener('focus',()=>render(inp));
    inp.addEventListener('input',()=>render(inp));
    list.addEventListener('mousedown',e=>e.preventDefault());
    list.addEventListener('click',e=>{
      const btn=e.target.closest('.dfProdutoOpcao');if(!btn)return;
      const ids=JSON.parse(list.dataset.ids||'[]');
      const p=produtos.find(x=>x.id===ids[Number(btn.dataset.i)]);if(p)apply(inp,p);
    });
    inp.addEventListener('blur',()=>setTimeout(()=>list.classList.remove('on'),150));
    return true;
  }

  async function init(){
    style();
    try{const r=await fetch('./produtos-catalogo-teste.json?ts='+Date.now(),{cache:'no-store'});produtos=await r.json()}catch(e){produtos=[]}
    if(bind())return;
    let n=0;const t=setInterval(()=>{n++;if(bind()||n>40)clearInterval(t)},250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('df-ui-ready',()=>setTimeout(init,100));
})();
