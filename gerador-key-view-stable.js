(function(){
  'use strict';
  if(window.DFAdminKeyViewStable)return;
  window.DFAdminKeyViewStable=true;

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let loading=false;

  function style(){
    if($('dfKeyViewCss'))return;
    const s=document.createElement('style');
    s.id='dfKeyViewCss';
    s.textContent=[
      '#dfKeyViewCard{border-color:#2563eb!important}',
      '#dfKeyViewTop{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
      '#dfKeyViewTop .btn{width:auto;flex:1;min-width:180px}',
      '#dfKeyFilter{margin-top:10px}',
      '#dfKeyViewList{display:grid;gap:8px;margin-top:12px}',
      '.dfKeyRow{border:1px solid #334155;background:#111827;border-radius:12px;padding:11px}',
      '.dfKeyCode{font:900 13px ui-monospace,SFMono-Regular,Consolas,monospace;word-break:break-all;color:#f8fafc}',
      '.dfKeyMeta{font-size:11px;color:#94a3b8;line-height:1.5;margin-top:5px}',
      '.dfKeyTag{display:inline-block;margin-bottom:6px;border:1px solid #475569;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:900;color:#cbd5e1}',
      '.dfKeyRow button{margin-top:8px;border:1px solid #2563eb;background:#0b1d3a;color:#dbeafe;border-radius:8px;padding:7px 9px;font-size:10px;font-weight:900}',
      '@media(max-width:560px){#dfKeyViewTop{display:grid;grid-template-columns:1fr}#dfKeyViewTop .btn{width:100%;min-width:0}}'
    ].join('');
    document.head.appendChild(s);
  }

  async function post(path){
    const secret=String($('secret')?.value||'').trim();
    if(!secret)throw new Error('Digite a senha administrativa.');
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),12000);
    try{
      const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','X-DF-Admin':secret},body:'{}',cache:'no-store',signal:ctrl.signal});
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)throw new Error(j.error||('Erro HTTP '+r.status));
      return j;
    }finally{clearTimeout(timer)}
  }

  function statusText(v){
    const s=String(v||'').toLowerCase();
    if(s==='free')return'LIVRE';
    if(s==='reserved')return'RESERVADA';
    if(s==='used')return'EM USO';
    if(s==='paused')return'PAUSADA';
    if(s==='revoked')return'BLOQUEADA';
    if(s==='expired')return'VENCIDA';
    return String(v||'DESCONHECIDA').toUpperCase();
  }

  function render(rows){
    const list=$('dfKeyViewList');if(!list)return;
    const q=String($('dfKeyFilter')?.value||'').trim().toLowerCase();
    const filtered=rows.filter(it=>[it.licenseKey,it.identity,it.status,it.platform,it.city,it.state].some(v=>String(v||'').toLowerCase().includes(q)));
    if(!filtered.length){list.innerHTML='<div class="empty">Nenhuma key encontrada.</div>';return}
    list.innerHTML=filtered.map((it,i)=>{
      const key=String(it.licenseKey||'').trim();
      const name=String(it.identity||'').trim();
      const loc=[it.city,it.state].filter(Boolean).join(' - ');
      const meta=[name&&('Nome: '+name),it.platform&&('Dispositivo: '+it.platform),loc&&('Local: '+loc)].filter(Boolean).join('<br>');
      return '<div class="dfKeyRow" data-key-row="'+i+'"><span class="dfKeyTag">'+esc(statusText(it.status))+'</span><div class="dfKeyCode">'+esc(key||'KEY NÃO INFORMADA')+'</div><div class="dfKeyMeta">'+(meta||'Sem dados adicionais')+'</div>'+(key?'<button type="button" data-key-copy="'+esc(key)+'">COPIAR KEY</button>':'')+'</div>';
    }).join('');
    list.querySelectorAll('[data-key-copy]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.keyCopy||'');const old=b.textContent;b.textContent='COPIADA';setTimeout(()=>b.textContent=old,1200)}catch(e){}});
  }

  let allRows=[];
  async function load(){
    if(loading)return;
    loading=true;
    const btn=$('dfKeyViewBtn'),msg=$('dfKeyViewMsg');
    if(btn){btn.disabled=true;btn.textContent='CARREGANDO KEYS...'}
    if(msg){msg.textContent='Buscando estoque e acessos no servidor...';msg.className='status'}
    try{
      const results=await Promise.allSettled([post('/admin/access/list-stock'),post('/admin/access/list-used')]);
      let rows=[],errors=[];
      results.forEach(r=>{if(r.status==='fulfilled')rows=rows.concat(Array.isArray(r.value.items)?r.value.items:[]);else errors.push(r.reason?.message||'Falha ao consultar')});
      const seen=new Set();allRows=rows.filter(it=>{const k=String(it?.licenseKey||'').trim();const id=String(it?.id||'');const sig=k||('id:'+id);if(!sig||seen.has(sig))return false;seen.add(sig);return true});
      render(allRows);
      if(msg){msg.textContent=allRows.length+' key(s) encontrada(s)'+(errors.length?' • uma consulta falhou, mas a outra carregou.':'.');msg.className='status '+(allRows.length?'ok':'')}
    }catch(e){
      if(msg){msg.textContent=e.name==='AbortError'?'Servidor demorou para responder. Tente novamente.':e.message;msg.className='status bad'}
    }finally{
      loading=false;if(btn){btn.disabled=false;btn.textContent='🔑 VER TODAS AS KEYS'}
    }
  }

  function mount(){
    style();if($('dfKeyViewCard'))return true;
    const wrap=document.querySelector('.wrap');if(!wrap)return false;
    const admin=wrap.querySelector('.card');if(!admin)return false;
    const card=document.createElement('div');card.className='card';card.id='dfKeyViewCard';
    card.innerHTML='<h2>🔑 Visualizar keys</h2><div class="sub">Mostra em uma tela só as keys livres, reservadas, em uso, pausadas, vencidas ou bloqueadas.</div><div id="dfKeyViewTop"><button class="btn copy" id="dfKeyViewBtn" type="button">🔑 VER TODAS AS KEYS</button></div><input id="dfKeyFilter" type="search" placeholder="Buscar por key, nome, status ou dispositivo"><div id="dfKeyViewMsg" class="status"></div><div id="dfKeyViewList"><div class="empty">Digite a senha administrativa e toque em VER TODAS AS KEYS.</div></div>';
    admin.insertAdjacentElement('afterend',card);
    $('dfKeyViewBtn').onclick=load;
    $('dfKeyFilter').addEventListener('input',()=>render(allRows));
    return true;
  }

  function init(){if(!mount()){setTimeout(init,150);return}const secret=$('secret');if(secret)secret.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();load()}})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
