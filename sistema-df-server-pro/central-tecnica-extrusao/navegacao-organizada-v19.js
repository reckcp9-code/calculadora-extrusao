(function(){
'use strict';
if(window.DFOrganizedNavigationV19)return;
window.DFOrganizedNavigationV19=true;
const $=id=>document.getElementById(id);
const modes=[
  ['automatico','Projeto automático','Dimensione zonas, profundidade e núcleo com os dados da rosca.'],
  ['geometria','Geometria e reforma','Compare as medidas atuais com o projeto da rosca.'],
  ['mecanica','Análise mecânica','Confira torque, RPM, volume e limites informados.'],
  ['transmissao','Transmissão','Informe o que está e o que deseja para calcular as polias.'],
  ['ajuda','Como usar','Veja as instruções de cada cálculo.']
];
const menuGroups=[
  ['Operação','Acompanhe a máquina em funcionamento.',[
    ['calcPage','Cálculo atual','RPM, produção e corrente']
  ]],
  ['Projetos','Dimensione antes de mudar a máquina.',[
    ['screwProjectPage','Projeto de Rosca','Automático, geometria, mecânica e transmissão'],
    ['screwAutoAssistantPage','Assistente de Rosca','Orientação para o projeto'],
    ['projectPage','Projeto de Polias','Cálculo manual dos componentes']
  ]],
  ['Análises','Investigue a rosca e o processo.',[
    ['ldAnalysisPage','Análise L/D','Comprimento e zonas da rosca'],
    ['compressionIntensityPage','Intensidade de Compressão','Comparação e intensidade'],
    ['technicalDiagnosticPage','Análise de Cisalhamento','Temperaturas e testes']
  ]],
  ['Máquinas','Cadastre os dados usados nos projetos.',[
    ['machinesPage','Máquinas salvas','Cadastro e seleção de máquinas']
  ]]
];
function style(){const s=document.createElement('style');s.id='dfNav19Style';s.textContent=`
#homeView .menuTabs{display:none!important}
.df19Intro{padding:15px 17px;margin:18px 0 10px;border:1px solid #35506a;border-radius:17px;background:linear-gradient(120deg,#142538,#101725);color:#e2e8f0;line-height:1.5}
.df19Intro b{display:block;color:#ffd36a;font-size:14px;margin-bottom:3px}
.df19Intro span{font-size:12px;color:#cbd5e1}
.df19Group{margin:19px 0 23px}.df19Group h2{font-size:17px;margin:0 0 2px;color:#f8fafc}.df19Group p{font-size:12px;color:#94a3b8;margin:0 0 10px}
.df19Links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.df19Link{text-align:left;border:1px solid #334155;border-radius:15px;background:#111c2c;color:#fff;padding:14px;min-height:83px;cursor:pointer;font:inherit;transition:background .15s,border-color .15s,transform .15s}
.df19Link:hover,.df19Link:focus-visible{background:#1c3047;border-color:#f5a000;transform:translateY(-1px)}
.df19Link b{display:block;font-size:14px;margin-bottom:4px}.df19Link span{display:block;color:#aabbd0;font-size:11px;line-height:1.45}
#screwProjectPage .df19Tabs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:thin;padding:4px 0 12px;margin:9px 0 0;position:sticky;top:0;z-index:8;background:#080b13}
#screwProjectPage .df19Tab{flex:none;padding:10px 12px;border:1px solid #35465d;border-radius:12px;background:#101a2a;color:#cbd5e1;font:700 12px system-ui;cursor:pointer}
#screwProjectPage .df19Tab[aria-selected="true"]{border-color:#f5a000;background:#382307;color:#ffd36a}
#screwProjectPage .df19Pane[hidden]{display:none!important}
.df19PaneLead{border-left:3px solid #f5a000;padding:8px 11px;margin:0 0 11px;color:#b9c9d9;font-size:12px;line-height:1.5}
@media(max-width:560px){.df19Links{grid-template-columns:1fr}.df19Link{min-height:72px}#screwProjectPage .df19Tabs{margin-left:-3px;margin-right:-3px}}
`;document.head.appendChild(s)}
function open(target){let button={
  calcPage:'[data-open="calcPage"]',projectPage:'[data-open="projectPage"]',machinesPage:'[data-open="machinesPage"]',
  screwProjectPage:'#df19ScrewOriginal',screwAutoAssistantPage:'#saMenuBtn',ldAnalysisPage:'[data-ld-open]',
  compressionIntensityPage:'#ciMenuButton',technicalDiagnosticPage:'#diagMenuButton'
}[target];
  let b=button&&document.querySelector(button);
  if(b)b.click();
}
function home(){const view=$('homeView'),tabs=view?.querySelector('.menuTabs');if(!view||!tabs||$('df19Home'))return;
  const screw=[...tabs.querySelectorAll('.menuBtn')].find(b=>b.textContent.includes('PROJETO DE ROSCA'));if(screw)screw.id='df19ScrewOriginal';
  const holder=document.createElement('div');holder.id='df19Home';
  const intro=document.createElement('div');intro.className='df19Intro';intro.innerHTML='<b>O que você vai fazer agora?</b><span>Escolha uma área. Os dados da máquina acompanham você nos cálculos e cada assunto abre em sua própria tela.</span>';holder.appendChild(intro);
  for(const [title,description,links] of menuGroups){const section=document.createElement('section');section.className='df19Group';const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=description;const grid=document.createElement('div');grid.className='df19Links';
    for(const [target,name,summary] of links){const button=document.createElement('button');button.type='button';button.className='df19Link';button.dataset.target=target;button.innerHTML='<b></b><span></span>';button.querySelector('b').textContent=name;button.querySelector('span').textContent=summary;button.addEventListener('click',()=>open(target));grid.appendChild(button)}
    section.append(h,p,grid);holder.appendChild(section)}
  tabs.insertAdjacentElement('afterend',holder);
  const old=view.querySelector('.homeInfo');if(old)old.hidden=true;
}
function project(){const page=$('screwProjectPage');if(!page||$('df19Tabs'))return;
  const all=[...page.querySelectorAll(':scope > .card')];
  const required=['ps14Card','ev16Card','ev17Summary','tpCard','spHelpCard'];if(required.some(id=>!$(id)))return;
  const machine=all.find(card=>card.contains($('spM')));
  const nav=document.createElement('div');nav.id='df19Tabs';nav.className='df19Tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Modos do Projeto de Rosca');
  const panes={};let selected='automatico';try{const stored=localStorage.getItem('df_project_mode_v19');if(modes.some(m=>m[0]===stored))selected=stored}catch(e){}
  for(const [key,title,lead] of modes){const tab=document.createElement('button');tab.type='button';tab.className='df19Tab';tab.id='df19Tab-'+key;tab.textContent=title;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','df19Pane-'+key);tab.addEventListener('click',()=>select(key,true));nav.appendChild(tab);
    const pane=document.createElement('div');pane.id='df19Pane-'+key;pane.className='df19Pane';pane.setAttribute('role','tabpanel');pane.setAttribute('aria-labelledby',tab.id);const intro=document.createElement('p');intro.className='df19PaneLead';intro.textContent=lead;pane.appendChild(intro);panes[key]=pane}
  machine.insertAdjacentElement('afterend',nav);for(const [key] of modes)page.appendChild(panes[key]);
  const byId={ps14Card:'automatico',ev17Summary:'mecanica',ev16Card:'mecanica',tpCard:'transmissao',spHelpCard:'ajuda'};
  for(const card of all){if(card===machine)continue;let key=byId[card.id]||'geometria';panes[key].appendChild(card)}
  function select(key,scroll){for(const [id] of modes){const active=id===key;panes[id].hidden=!active;const tab=$('df19Tab-'+id);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1}try{localStorage.setItem('df_project_mode_v19',key)}catch(e){}if(scroll&&nav.getBoundingClientRect().top<0)nav.scrollIntoView({block:'start',behavior:'smooth'})}
  select(selected,false);
}
function boot(){style();let attempts=0;const timer=setInterval(()=>{home();project();if($('df19Home')&&$('df19Tabs')||++attempts>90)clearInterval(timer)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
