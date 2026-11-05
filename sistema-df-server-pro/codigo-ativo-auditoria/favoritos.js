(function(){
  'use strict';

  const FAV_KEY='df_favoritos_v1';

  function $(id){return document.getElementById(id)}
  function loadFavs(){try{const a=JSON.parse(localStorage.getItem(FAV_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
  function saveFavs(a){try{localStorage.setItem(FAV_KEY,JSON.stringify([...new Set(a)]))}catch(e){}}

  const ITEMS={
    'peso-metro':{title:'Peso ideal por metro',page:'ex',find:function(){const pg=$('pgEx');if(!pg)return null;return [...pg.querySelectorAll(':scope > .card')].find(c=>/Peso ideal por metro/i.test(c.textContent||''))||null}},
    'micra-real':{title:'Descobrir micra pelo peso',page:'ex',find:function(){const pg=$('pgEx');if(!pg)return null;return [...pg.querySelectorAll(':scope > .card')].find(c=>/Descobrir micra pelo peso de 1 metro/i.test(c.textContent||''))||null}},
    'peso-bobina':{title:'Peso da bobina pelo raio',page:'ex',find:function(){return $('dfBobinaCard')}}
  };

  function addStyle(){
    if($('dfFavStyle'))return;
    const st=document.createElement('style');
    st.id='dfFavStyle';
    st.textContent=[
      '#dfFavBtn{border-color:#f59e0b!important;color:#fde68a!important}',
      '#dfQuickAccess.dfFavFour{grid-template-columns:repeat(4,1fr)!important}',
      '.dfFavStar{float:right;margin:-2px 0 8px 10px;border:1px solid #475569;background:#0f172a;color:#cbd5e1;border-radius:10px;padding:7px 9px;font-weight:900;font-size:12px;cursor:pointer}',
      '.dfFavStar.on{border-color:#f59e0b;background:#241600;color:#ffd36a}',
      '.dfFavList{display:grid;gap:9px;margin-top:12px}',
      '.dfFavItem{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #334155;background:#0f172a;border-radius:13px;padding:12px}',
      '.dfFavOpen{flex:1;text-align:left;border:0;background:transparent;color:#f8fafc;font-weight:900;font-size:14px;cursor:pointer}',
      '.dfFavRemove{border:1px solid #7f1d1d;background:#230b0b;color:#fca5a5;border-radius:9px;padding:7px 9px;font-size:11px;font-weight:900;cursor:pointer}',
      '.dfFavEmpty{border:1px dashed #475569;border-radius:13px;padding:16px;text-align:center;color:#94a3b8;font-size:13px}',
      '@media(max-width:560px){#dfQuickAccess.dfFavFour{grid-template-columns:repeat(2,1fr)!important}}'
    ].join('');
    document.head.appendChild(st);
  }

  function ensurePage(){
    const app=$('appContent');
    if(!app||$('pgFav'))return;
    const section=document.createElement('section');
    section.id='pgFav';
    section.className='page';
    section.innerHTML='<div class="card"><span class="tag">Favoritos</span><h2>⭐ Meus favoritos</h2><div class="hint">Adicione as calculadoras que você mais usa para abrir direto sem ficar procurando.</div><div id="dfFavList" class="dfFavList"></div></div>';
    const foot=app.querySelector('.foot');
    if(foot)foot.insertAdjacentElement('beforebegin',section);else app.appendChild(section);
  }

  function ensureButton(){
    const box=$('dfQuickAccess');
    if(!box||$('dfFavBtn'))return;
    box.classList.add('dfFavFour');
    const b=document.createElement('button');
    b.id='dfFavBtn';b.type='button';b.className='dfQuickBtn';b.textContent='⭐ FAVORITOS';
    b.addEventListener('click',showFavorites);
    box.appendChild(b);
  }

  function toggleFavorite(key){
    const a=loadFavs();
    const i=a.indexOf(key);
    if(i>=0)a.splice(i,1);else a.push(key);
    saveFavs(a);refreshStars();render();
  }

  function ensureStars(){
    Object.keys(ITEMS).forEach(function(key){
      const card=ITEMS[key].find();
      if(!card)return;
      let b=card.querySelector('[data-df-fav="'+key+'"]');
      if(!b){
        b=document.createElement('button');b.type='button';b.className='dfFavStar';b.dataset.dfFav=key;
        b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();toggleFavorite(key)});
        const h=card.querySelector('h2');if(h)h.insertAdjacentElement('beforebegin',b);else card.insertBefore(b,card.firstChild);
      }
    });
    refreshStars();
  }

  function refreshStars(){
    const set=new Set(loadFavs());
    document.querySelectorAll('.dfFavStar[data-df-fav]').forEach(function(b){
      const on=set.has(b.dataset.dfFav);b.classList.toggle('on',on);b.textContent=on?'★ FAVORITO':'☆ FAVORITO';
    });
  }

  function showOnly(pageId,buttonId){
    document.querySelectorAll('#appContent .page').forEach(p=>p.classList.remove('on'));
    document.querySelectorAll('#appContent .tab,#dfQuickAccess .dfQuickBtn').forEach(b=>b.classList.remove('on'));
    const p=$(pageId);if(p)p.classList.add('on');
    const b=$(buttonId);if(b)b.classList.add('on');
  }

  function openItem(key){
    const item=ITEMS[key];if(!item)return;
    try{if(typeof window.show==='function')window.show(item.page)}catch(e){}
    requestAnimationFrame(function(){
      const card=item.find();if(card){try{card.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){card.scrollIntoView()}}
    });
  }

  function render(){
    const box=$('dfFavList');if(!box)return;
    const favs=loadFavs().filter(k=>ITEMS[k]);
    if(!favs.length){box.innerHTML='<div class="dfFavEmpty">Você ainda não adicionou nenhum favorito. Toque em ☆ FAVORITO nas calculadoras.</div>';return}
    box.innerHTML='';
    favs.forEach(function(key){
      const item=ITEMS[key],row=document.createElement('div');row.className='dfFavItem';
      const open=document.createElement('button');open.type='button';open.className='dfFavOpen';open.textContent='⭐ '+item.title;open.onclick=function(){openItem(key)};
      const rem=document.createElement('button');rem.type='button';rem.className='dfFavRemove';rem.textContent='REMOVER';rem.onclick=function(){toggleFavorite(key)};
      row.append(open,rem);box.appendChild(row);
    });
  }

  function showFavorites(){
    ensurePage();render();showOnly('pgFav','dfFavBtn');
    const h=$('heroTitle'),s=$('heroSub');if(h)h.textContent='DF EXTRUSOR PRO';if(s)s.textContent='FAVORITOS • ACESSO RÁPIDO';
    try{history.replaceState(null,'','./#favoritos')}catch(e){}
    try{scrollTo(0,0)}catch(e){}
  }

  function ensure(){addStyle();ensurePage();ensureButton();ensureStars();render()}
  function init(){
    ensure();
    requestAnimationFrame(ensure);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)ensure()});
    window.addEventListener('df-ui-ready',ensure);
    if(location.hash==='#favoritos')showFavorites();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
