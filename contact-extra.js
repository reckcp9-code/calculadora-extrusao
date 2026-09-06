(function(){
  const INSTAGRAM='https://www.instagram.com/Df_manutencao_consultoria/';
  const WHATSAPP='https://wa.me/5547992825006?text='+encodeURIComponent('Olá, vim pelo DF EXTRUSOR PRO e quero mais informações.');
  const WHATSAPP_TXT='47 99282-5006';
  const INSTAGRAM_TXT='@Df_manutencao_consultoria';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfContactStyle')) return;
    const st=document.createElement('style');
    st.id='dfContactStyle';
    st.textContent=[
      '.dfContactCard{border-color:#3b2b0b!important;background:linear-gradient(180deg,#111827,#0f172a)!important}',
      '.dfContactTitle{display:flex;align-items:center;gap:8px;margin-bottom:8px}',
      '.dfContactGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}',
      '.dfContactBtn{display:flex!important;align-items:center;justify-content:center;gap:8px;text-align:center;text-decoration:none;line-height:1.15;min-height:56px}',
      '.dfContactBtn small{display:block;color:inherit;opacity:.9;font-size:11px;margin-top:3px;font-weight:800}',
      '.dfContactIcon{font-size:22px;line-height:1}',
      '.dfInsta{border-color:#ec4899!important;background:#2a1021!important;color:#fbcfe8!important}',
      '.dfWhats{border-color:#22c55e!important;background:#0c321c!important;color:#bbf7d0!important}',
      '@media(max-width:560px){.dfContactGrid{grid-template-columns:1fr}.dfContactBtn{min-height:54px}}'
    ].join('');
    document.head.appendChild(st);
  }

  function contactHtml(id){
    return '<div class="card dfContactCard" id="'+id+'">'+
      '<span class="tag">Contato</span>'+
      '<h2 class="dfContactTitle">📲 Suporte DF</h2>'+
      '<div class="hint">Clique em uma opção para falar direto com a DF Manutenção e Consultoria.</div>'+
      '<div class="dfContactGrid">'+
        '<a class="calcBtn dfContactBtn dfInsta" href="'+INSTAGRAM+'" target="_blank" rel="noopener">'+
          '<span class="dfContactIcon">📸</span><span>INSTAGRAM<small>'+INSTAGRAM_TXT+'</small></span>'+
        '</a>'+
        '<a class="calcBtn dfContactBtn dfWhats" href="'+WHATSAPP+'" target="_blank" rel="noopener">'+
          '<span class="dfContactIcon">🟢</span><span>WHATSAPP<small>'+WHATSAPP_TXT+'</small></span>'+
        '</a>'+
      '</div>'+
    '</div>';
  }

  function addContacts(){
    addStyle();
    ['pgEx','pgSa','pgCu','pgFo','pgAj'].forEach(function(pid){
      const page=$(pid);
      if(!page) return;
      const cid='dfContact_'+pid;
      if($(cid)) return;
      page.insertAdjacentHTML('beforeend',contactHtml(cid));
    });
  }

  function init(){
    addContacts();
    setTimeout(addContacts,300);
    setTimeout(addContacts,900);
    setTimeout(addContacts,1800);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

  document.addEventListener('click',function(){setTimeout(addContacts,250)},true);
  setInterval(addContacts,3000);
})();
