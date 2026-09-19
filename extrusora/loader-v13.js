(async function(){
'use strict';
const showError=(msg)=>{document.body.innerHTML='<div class="boot"><h2>DF • Central Técnica de Extrusão</h2><p>'+String(msg||'Não foi possível carregar esta versão.')+'</p><button onclick="location.reload()">TENTAR NOVAMENTE</button></div>'};
try{
  const r=await fetch('./base-v9.html?v=17.2',{cache:'no-store'});
  if(!r.ok)throw new Error('Base indisponível');
  let html=await r.text();
  if(!html||!html.includes('</body>'))throw new Error('Base inválida');
  const extras=[
    '<script src="./projeto-rosca-v10.js?v=10.6"></script>',
    '<script src="./projeto-rosca-dimensionamento-v14.js?v=14.4"></script>',
    '<script src="./assistente-projeto-rosca-v15.js?v=15.3"></script>',
    '<script src="./projeto-rosca-engenharia-v16.js?v=16.2"></script>',
    '<script src="./integracao-mecanica-v17.js?v=17.1"></script>',
    '<script src="./integracao-mecanica-fix-v17-2.js?v=17.2"></script>',
    '<script src="./projeto-transmissao-v18.js?v=18.1"></script>',
    '<script src="./projeto-rosca-ajuda-v12.js?v=12.6"></script>',
    '<script src="./relacao-polias-v11.js?v=11.6"></script>',
    '<script src="./diagnostico-tecnico-v9.js?v=9.7"></script>'
  ].join('');
  html=html.replace('</body>',extras+'</body>');
  document.open();
  document.write(html);
  document.close();
}catch(e){
  showError('Não foi possível carregar esta versão.');
}
})();
