(function(){
'use strict';
if(window.DFScrewProjectHelpV12)return;window.DFScrewProjectHelpV12=true;
const $=id=>document.getElementById(id);
function ensure(){
  const page=$('screwProjectPage');
  if(!page||$('spHelpCard'))return !!page;
  const st=document.createElement('style');
  st.id='spHelpStyle';
  st.textContent='.spHelpGrid{display:grid;gap:8px}.spHelpItem{border:1px solid #263244;background:#0f172a;border-radius:13px;padding:11px}.spHelpItem b{display:block;color:#ffd36a;font-size:11px;margin-bottom:4px}.spHelpItem p{margin:0;color:#cbd5e1;font-size:10.5px;line-height:1.5}.spHelpNote{border:1px solid #5b4715;background:#171207;border-radius:13px;padding:11px;color:#fde68a;font-size:10.5px;line-height:1.5;margin-bottom:9px}.spHelpToggle{margin-bottom:10px}.spHelpHidden{display:none!important}';
  document.head.appendChild(st);
  const card=document.createElement('div');
  card.className='card';card.id='spHelpCard';
  card.innerHTML='<h2>ℹ️ Para que serve cada função</h2><button id="spHelpToggle" class="btn secondary spHelpToggle" type="button">OCULTAR EXPLICAÇÕES</button><div id="spHelpBody"><div class="spHelpNote"><b>Como ler “D”:</b> 1D é igual ao diâmetro da rosca. Exemplo: numa rosca de 55 mm, 10D correspondem a 550 mm de comprimento.</div><div class="spHelpGrid">'+
  '<div class="spHelpItem"><b>Máquina</b><p>Seleciona a extrusora cadastrada e carrega os dados já salvos dela para usar como base do projeto.</p></div>'+
  '<div class="spHelpItem"><b>Material principal</b><p>Registra qual família de material será considerada no projeto. Serve como contexto técnico; não substitui dados reais de viscosidade, índice de fluidez ou reologia.</p></div>'+
  '<div class="spHelpItem"><b>Objetivo</b><p>Define o perfil da referência geométrica: menos cisalhamento/aquecimento, equilibrado ou priorizar produção. Ele orienta a sugestão inicial das zonas, sem afirmar que aquela divisão é a única correta.</p></div>'+
  '<div class="spHelpItem"><b>Diâmetro da rosca</b><p>É a medida externa da rosca em milímetros. O app usa esse valor para converter comprimentos em D para milímetros e para calcular os diâmetros de raiz.</p></div>'+
  '<div class="spHelpItem"><b>L/D desejado</b><p>É a relação entre o comprimento útil da rosca e o diâmetro. Exemplo: 55 mm com L/D 32 resulta em aproximadamente 1.760 mm de comprimento útil.</p></div>'+
  '<div class="spHelpItem"><b>Aplicar referência geométrica</b><p>Preenche automaticamente uma divisão inicial das zonas conforme o L/D e o objetivo escolhido. É ponto de partida para estudo, não desenho final de fabricação.</p></div>'+
  '<div class="spHelpItem"><b>Zona de alimentação</b><p>Região que recebe e transporta o material sólido para dentro do canhão. O comprimento influencia a capacidade de alimentação, compactação inicial e estabilidade de entrada do material.</p></div>'+
  '<div class="spHelpItem"><b>Zona de compressão / transição</b><p>Região onde o canal vai diminuindo e o material passa progressivamente de sólido para fundido. Uma transição mais curta pode concentrar plastificação e cisalhamento; uma mais longa tende a distribuir essa transformação ao longo de mais comprimento.</p></div>'+
  '<div class="spHelpItem"><b>Zona de dosagem</b><p>Região final que ajuda a homogeneizar o fundido e estabilizar a vazão antes do cabeçote. Sua geometria também influencia pressão, bombeamento e estabilidade de processo.</p></div>'+
  '<div class="spHelpItem"><b>Comprimento útil</b><p>É calculado automaticamente por diâmetro × L/D. Representa o comprimento considerado no pré-dimensionamento das zonas.</p></div>'+
  '<div class="spHelpItem"><b>Profundidade do canal na alimentação</b><p>É a profundidade do canal no início da rosca. Junto com a profundidade da dosagem, entra no cálculo geométrico da taxa de compressão.</p></div>'+
  '<div class="spHelpItem"><b>Profundidade do canal na dosagem</b><p>É a profundidade do canal na região final. Canal menor aumenta a relação geométrica de compressão quando a alimentação permanece igual.</p></div>'+
  '<div class="spHelpItem"><b>Taxa geométrica de compressão</b><p>O app calcula alimentação ÷ dosagem. Exemplo: 6,0 mm ÷ 2,5 mm = 2,4:1. É uma relação geométrica simplificada e não representa sozinha pressão, torque ou cisalhamento real.</p></div>'+
  '<div class="spHelpItem"><b>Raiz da alimentação e da dosagem</b><p>Mostra o diâmetro aproximado no fundo do canal, calculado a partir do diâmetro externo da rosca e da profundidade do canal. Ajuda a visualizar quanto material seria removido ou acrescentado numa reforma.</p></div>'+
  '<div class="spHelpItem"><b>Simular outra configuração</b><p>Permite comparar uma segunda combinação de L/D e comprimentos de zonas com o projeto principal, sem apagar a primeira proposta.</p></div>'+
  '<div class="spHelpItem"><b>Medidas para reforma</b><p>Compara geometria atual e projetada e mostra a diferença. Serve para enxergar o que mudaria, mas a usinagem deve ser validada com desenho, folgas, passo, filetes, resistência e fabricante.</p></div>'+
  '<div class="spHelpItem"><b>Análise técnica</b><p>Destaca pontos de atenção da geometria, como compressão proporcionalmente curta ou taxa elevada. São alertas para investigação, não diagnóstico automático de defeito.</p></div>'+
  '<div class="spHelpItem"><b>Salvar projeto na máquina</b><p>Guarda material, objetivo, L/D, zonas, profundidades e comparação junto ao cadastro da máquina para consultar depois.</p></div>'+
  '</div></div>';
  const head=page.querySelector('.pageHead');
  if(head)head.insertAdjacentElement('afterend',card);else page.prepend(card);
  const t=$('spHelpToggle'),body=$('spHelpBody');
  t.addEventListener('click',()=>{const hidden=body.classList.toggle('spHelpHidden');t.textContent=hidden?'MOSTRAR EXPLICAÇÕES':'OCULTAR EXPLICAÇÕES'});
  return true;
}
function boot(){let n=0;const t=setInterval(()=>{n++;if(ensure()||n>80)clearInterval(t)},150);window.addEventListener('pageshow',()=>setTimeout(ensure,200))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();