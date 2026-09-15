(async function(){
'use strict';
const showError=(msg)=>{document.body.innerHTML='<div class="boot"><h2>DF • Central Técnica de Extrusão</h2><p>'+String(msg||'Não foi possível carregar esta versão.')+'</p><button onclick="location.reload()">TENTAR NOVAMENTE</button></div>'};
try{
  const r=await fetch('./base-v9.html?v=14',{cache:'no-store'});
  if(!r.ok)throw new Error('Base indisponível');
  let html=await r.text();
  if(!html||!html.includes('</body>'))throw new Error('Base inválida');
  const extras=[
    '<script src="./projeto-rosca-v10.js?v=10.3"></script>',
    '<script src="./projeto-rosca-dimensionamento-v14.js?v=14.1"></script>',
    '<script src="./projeto-rosca-ajuda-v12.js?v=12.3"></script>',
    '<script src="./relacao-polias-v11.js?v=11.3"></script>',
    '<script src="./diagnostico-tecnico-v9.js?v=9.4"></script>'
  ].join('');
  html=html.replace('</body>',extras+'</body>');
  document.open();
  document.write(html);
  document.close();
}catch(e){
  showError('Não foi possível carregar esta versão.');
}
})();