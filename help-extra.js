(function(){
  const $=id=>document.getElementById(id);
  function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

  const manualHtml = `
  <section id="pgAj" class="page">
    <div class="card">
      <span class="tag">Ajuda</span>
      <h2>Manual de operação — DF EXTRUSOR PRO</h2>
      <div class="hint">Este manual explica cada função do sistema para operador, encarregado, produção e cliente.</div>
    </div>

    <div class="card">
      <h2>1. Objetivo do sistema</h2>
      <div class="formNote">O DF EXTRUSOR PRO foi desenvolvido para facilitar os cálculos do dia a dia na extrusão de filme plástico, sacolas, custo, formulação, PDF e OP de produção.</div>
      <div class="kpi"><span>O sistema ajuda a calcular</span><b>Peso por metro, micra, RPM, sacolas, custo, lucro, formulação e OP</b></div>
    </div>

    <div class="card">
      <h2>2. Acesso por licença</h2>
      <div class="formNote">Ao abrir o sistema, o usuário deve digitar a chave de licença no campo Licença DF e clicar em ATIVAR / ENTRAR.</div>
      <div class="kpi"><span>Licença válida</span><b>Libera o sistema</b></div>
      <div class="kpi"><span>Licença inválida</span><b>Mostra mensagem de erro</b></div>
      <div class="smallNote">Cada licença pode ser vinculada ao navegador ou aparelho usado pelo cliente.</div>
    </div>

    <div class="card">
      <h2>3. Aba Extrusão</h2>
      <div class="formNote">A aba Extrusão calcula o peso ideal de 1 metro de filme e auxilia na regulagem da máquina.</div>
      <div class="kpi"><span>Preencher</span><b>Largura, micra e densidade</b></div>
      <div class="kpi"><span>Resultado</span><b>Peso ideal de 1 metro em gramas</b></div>
      <div class="smallNote">A densidade pode ser escolhida em opções prontas ou digitada manualmente, útil para material reciclado.</div>
    </div>

    <div class="card">
      <h2>4. Descobrir micra real</h2>
      <div class="formNote">Corte 1 metro de filme, pese na balança e digite o peso medido. O sistema mostra a micra real do filme.</div>
      <div class="kpi"><span>Serve para saber</span><b>Se o filme está fino, grosso ou correto</b></div>
    </div>

    <div class="card">
      <h2>5. Corrigir micra por peso</h2>
      <div class="formNote">Use quando o peso real não bate com o peso ideal. Informe os RPMs atuais da máquina.</div>
      <div class="kpi"><span>Informar</span><b>RPM da massa, ar e puxador</b></div>
      <div class="kpi"><span>O sistema mostra</span><b>Correção pelo puxador ou pela massa</b></div>
      <div class="smallNote">Se o filme está pesado/grosso, normalmente aumenta o puxador ou diminui a massa. Se está leve/fino, normalmente diminui o puxador ou aumenta a massa.</div>
    </div>

    <div class="card">
      <h2>6. Aumentar ou diminuir produção</h2>
      <div class="formNote">Informe os RPMs atuais e a porcentagem que deseja aumentar ou diminuir.</div>
      <div class="kpi"><span>Exemplo</span><b>Aumentar 20% ou diminuir 10%</b></div>
      <div class="kpi"><span>Resultado</span><b>Novos RPMs de referência</b></div>
      <div class="smallNote">A função mantém a relação entre massa e puxador mais equilibrada para preservar a micra próxima.</div>
    </div>

    <div class="card">
      <h2>7. Aba Sacolas</h2>
      <div class="formNote">A aba Sacolas calcula peso do saco, peso do rolo e quantidade.</div>
      <div class="kpi"><span>Preencher</span><b>Largura, comprimento, micra, densidade, desconto e quantidade</b></div>
      <div class="kpi"><span>Resultados</span><b>Peso do saco, peso do rolo, sacos por kg e peso de 1.000 sacos</b></div>
      <div class="smallNote">O desconto de alça ou recorte deve ser usado quando a embalagem perde material no corte.</div>
    </div>

    <div class="card">
      <h2>8. Aba Custo</h2>
      <div class="formNote">A aba Custo calcula venda, lucro, preço por rolo e preço por unidade.</div>
      <div class="kpi"><span>Puxa da aba Sacolas</span><b>Peso do rolo e sacolas por rolo</b></div>
      <div class="kpi"><span>Também permite</span><b>Digitar manualmente</b></div>
      <div class="kpi"><span>Preencher</span><b>Custo por kg, lucro desejado % e quantidade de rolos</b></div>
      <div class="kpi"><span>Resultados</span><b>Preço por rolo, preço por unidade e lucro total</b></div>
    </div>

    <div class="card">
      <h2>9. Aba Formulação</h2>
      <div class="formNote">A aba Formulação serve para cadastrar materiais e montar misturas por porcentagem.</div>
      <div class="kpi"><span>Cadastrar material</span><b>Nome do material e preço por kg opcional</b></div>
      <div class="kpi"><span>Montar formulação</span><b>Nome, quantidade total, material e porcentagem</b></div>
      <div class="kpi"><span>O sistema mostra</span><b>Porcentagem total, kg de cada material, custo total e custo por kg</b></div>
      <div class="smallNote">A formulação deve fechar 100%. Se faltar ou passar, o sistema avisa.</div>
    </div>

    <div class="card">
      <h2>10. Formulações salvas</h2>
      <div class="formNote">Depois de salvar, a formulação fica disponível em uma barra de seleção.</div>
      <div class="kpi"><span>ABRIR</span><b>Carrega a formulação</b></div>
      <div class="kpi"><span>PDF</span><b>Gera relatório de formulação</b></div>
      <div class="kpi"><span>OP</span><b>Gera ordem de produção</b></div>
      <div class="kpi"><span>DUPLICAR</span><b>Cria uma cópia</b></div>
      <div class="kpi"><span>EXCLUIR</span><b>Apaga a formulação selecionada</b></div>
    </div>

    <div class="card">
      <h2>11. PDF da formulação</h2>
      <div class="formNote">O PDF mostra nome da formulação, quantidade total, materiais, porcentagem, kg de cada material, preço por kg, custo total e custo por kg final.</div>
      <div class="kpi"><span>Uso indicado</span><b>Conferência, orçamento e controle interno</b></div>
    </div>

    <div class="card">
      <h2>12. OP de produção</h2>
      <div class="formNote">A OP puxa automaticamente os dados da Extrusão e da Formulação.</div>
      <div class="kpi"><span>Puxa automático</span><b>Nome, peso, largura, comprimento, micra, gramatura, materiais e porcentagem</b></div>
      <div class="kpi"><span>Produção preenche</span><b>Data, operador, máquina, aparas, quantidade, paradas e bobinas</b></div>
      <div class="smallNote">A OP foi feita em A4 paisagem com os campos mais importantes destacados para facilitar a leitura na produção.</div>
    </div>

    <div class="card">
      <h2>13. Cuidados importantes</h2>
      <div class="formNote">Antes de usar os resultados na produção, confira se a largura está em cm, se a micra é parede dupla, se a densidade está correta, se o peso foi medido em 1 metro, se a quantidade de sacolas está correta e se a formulação fechou 100%.</div>
      <div class="smallNote">Os cálculos servem como referência técnica. A regulagem final deve ser feita pelo operador responsável, observando estabilidade do balão, qualidade do filme e peso real na balança.</div>
    </div>

    <div class="card">
      <h2>14. Resumo rápido</h2>
      <div class="kpi"><span>Extrusão</span><b>Peso por metro, micra real e correção RPM</b></div>
      <div class="kpi"><span>Sacolas</span><b>Peso do saco, peso do rolo e quantidade</b></div>
      <div class="kpi"><span>Custo</span><b>Preço de venda, lucro, rolo e unidade</b></div>
      <div class="kpi"><span>Formulação</span><b>Mistura de materiais e custo por kg</b></div>
      <div class="kpi"><span>PDF e OP</span><b>Relatório e ordem de produção</b></div>
    </div>

    <div class="card">
      <h2>15. Suporte</h2>
      <div class="formNote">Em caso de dúvida, entre em contato com a DF Manutenção e Consultoria.</div>
      <div class="result"><span>INSTAGRAM</span><b class="midRes">@Df_manutencao_consultoria</b></div>
    </div>
  </section>`;

  function addHelpTab(){
    const tabs=document.querySelector('.tabs');
    if(!tabs||$('btAj'))return;
    tabs.style.gridTemplateColumns='repeat(6,1fr)';
    const btn=document.createElement('button');
    btn.id='btAj';
    btn.className='tab';
    btn.type='button';
    btn.textContent='AJUDA';
    btn.addEventListener('click',function(){showHelp()});
    const curso=tabs.querySelector('button:last-child');
    if(curso)tabs.insertBefore(btn,curso);else tabs.appendChild(btn);
  }

  function addHelpPage(){
    if($('pgAj'))return;
    const wrap=$('appContent')||document.querySelector('.w');
    if(!wrap)return;
    wrap.insertAdjacentHTML('beforeend',manualHtml);
  }

  function markTab(on){
    ['btEx','btSa','btCu','btFo','btAj'].forEach(id=>{const b=$(id);if(b)b.classList.toggle('on',id==='btAj'&&on)});
  }

  function showHelp(){
    addHelpTab();addHelpPage();
    ['pgEx','pgSa','pgCu','pgFo'].forEach(id=>{const p=$(id);if(p)p.classList.remove('on')});
    const p=$('pgAj');if(p)p.classList.add('on');
    markTab(true);
    const h=$('heroTitle'),s=$('heroSub');
    if(h)h.textContent='DF EXTRUSOR PRO';
    if(s)s.textContent='MANUAL DE OPERAÇÃO • AJUDA • COMO USAR O SISTEMA';
    try{history.replaceState(null,'','./#ajuda')}catch(e){}
    try{scrollTo(0,0)}catch(e){}
  }

  function init(){
    addHelpTab();addHelpPage();
    const oldShow=window.show;
    if(!window.dfHelpShowWrapped){
      window.dfHelpShowWrapped=true;
      window.show=function(p){
        if(p==='aj'||p==='ajuda')return showHelp();
        if(oldShow)oldShow(p);
        const pg=$('pgAj');if(pg)pg.classList.remove('on');
        const b=$('btAj');if(b)b.classList.remove('on');
      };
    }
    if(location.hash==='#ajuda')setTimeout(showHelp,80);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,250));
  else setTimeout(init,250);
  setTimeout(init,900);
  setTimeout(init,1800);
})();