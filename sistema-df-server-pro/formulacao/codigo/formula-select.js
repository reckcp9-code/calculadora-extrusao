(function(){
  const q=id=>document.getElementById(id);
  function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function fm(v,d){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'}
  function money(v){const n=Number(v);return n>0?'R$ '+fm(n,2):'sem custo'}
  function load(){try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}}
  function save(a){try{if(window.saveForms){window.saveForms(a);return}}catch(e){}localStorage.setItem('df_formulacoes_v2',JSON.stringify(a));try{window.renderForms&&window.renderForms()}catch(e){}}
  function selected(){const id=q('foSavedSelect')&&q('foSavedSelect').value;return load().find(f=>String(f.id)===String(id))}
  function manualOpen(f){if(!f)return;if(q('foNome'))q('foNome').value=f.nome||'';if(q('foTotal'))q('foTotal').value=String(f.total||'').replace('.',',');try{window.renderMixRows&&window.renderMixRows(f.rows||[])}catch(e){}try{window.calcFo&&window.calcFo()}catch(e){}try{window.show&&window.show('fo')}catch(e){}}
  function updateInfo(){const box=q('foSavedInfo'),f=selected();if(!box)return;if(!f){box.innerHTML='Selecione uma formulação salva.';return}box.innerHTML='<b>'+esc(f.nome||'Formulação')+'</b><br>'+fm(f.total||0,2)+' kg • '+((f.rows||[]).length)+' materiais • '+money(f.custo||0)}
  window.renderForms=function(){
    const b=q('foSaved'),a=load();
    if(!b)return;
    if(!a.length){b.innerHTML='<div class="formNote">Nenhuma formulação salva ainda.</div>';return}
    const opts=a.map((f,i)=>'<option value="'+esc(f.id)+'" '+(i===0?'selected':'')+'>'+esc(f.nome||'Formulação')+' — '+fm(f.total||0,2)+' kg</option>').join('');
    b.innerHTML='<div class="formRow"><label>Formulação salva</label><select id="foSavedSelect">'+opts+'</select><div id="foSavedInfo" class="formNote"></div><div class="savedBtns" style="grid-template-columns:repeat(5,1fr)"><button class="miniBtn" data-foaction="open">ABRIR</button><button class="miniBtn" data-foaction="pdf">PDF</button><button class="miniBtn" data-foaction="op">OP</button><button class="miniBtn" data-foaction="dup">DUPLICAR</button><button class="delBtn" data-foaction="del">EXCLUIR</button></div></div>';
    q('foSavedSelect')&&q('foSavedSelect').addEventListener('change',updateInfo);
    updateInfo();
  };
  document.addEventListener('click',function(ev){
    const act=ev.target&&ev.target.dataset?ev.target.dataset.foaction:null;
    if(!act)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const f=selected();
    if(!f){alert('Selecione uma formulação.');return}
    if(act==='open'){ if(window.abrirFormula)window.abrirFormula(f,false); else manualOpen(f); return }
    if(act==='pdf'){ if(window.printFormulaPdf)window.printFormulaPdf(f); else alert('Função PDF não carregou. Atualize a página.'); return }
    if(act==='op'){ if(window.printFormulaOp)window.printFormulaOp(f); else alert('Função OP não carregou. Atualize a página.'); return }
    if(act==='dup'){
      const a=load();
      const cp=JSON.parse(JSON.stringify(f));
      cp.id=Date.now();cp.nome=(f.nome||'Formulação')+' cópia';cp.criado=new Date().toISOString();
      a.unshift(cp);save(a);return;
    }
    if(act==='del'){
      if(!confirm('Excluir esta formulação?'))return;
      save(load().filter(x=>String(x.id)!==String(f.id)));return;
    }
  },true);
  function start(){try{window.renderForms&&window.renderForms()}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,200));else setTimeout(start,200);
  setTimeout(start,800);
  setTimeout(start,1600);
})();
