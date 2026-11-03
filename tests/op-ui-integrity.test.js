'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function classes(...values){
 const s=new Set(values);
 return{add:x=>s.add(x),remove:x=>s.delete(x),contains:x=>s.has(x),toggle:(x,on)=>on?s.add(x):s.delete(x)};
}
function testReadyFullscreen(){
 const nodes=new Map(),docEvents={},winEvents={};let interval=null;
 const root={id:'dfFormulaOps',classList:classes('on')};
 const pane={id:'dfPaneOk',classList:classes('on')};
 const ready={dataset:{pane:'ok'},classList:classes('on')};
 const read={dataset:{pane:'read'},classList:classes(),click(){}};
 const tabs={querySelector:q=>q.includes('read')?read:ready};
 nodes.set('dfFormulaOps',root);nodes.set('dfPaneOk',pane);
 const document={
  readyState:'complete',hidden:false,
  getElementById:id=>nodes.get(id)||null,
  querySelector:q=>q==='#dfFormulaOps .dfOpsTabs'?tabs:q.includes('[data-pane="ok"]')?ready:q.includes('[data-pane="read"]')?read:null,
  createElement:()=>({id:'',innerHTML:''}),
  addEventListener:(name,fn)=>(docEvents[name]??=[]).push(fn),
  head:{appendChild:el=>nodes.set(el.id,el)},
  body:{classList:classes(),appendChild:el=>nodes.set(el.id,el)}
 };
 const window={addEventListener:(name,fn)=>(winEvents[name]??=[]).push(fn)};
 vm.runInNewContext(fs.readFileSync('op-ready-fullscreen-v1.js','utf8'),{document,window,setInterval:fn=>(interval=fn,1),setTimeout:fn=>(fn(),1),console});
 assert.ok(nodes.has('dfReadyFullTop'),'Full screen top must mount');
 interval();assert.ok(document.body.classList.contains('df-ready-full'),'Prontas must stay fullscreen');
 nodes.delete('dfReadyFullTop');interval();assert.ok(nodes.has('dfReadyFullTop'),'Missing header must be rebuilt');
 ready.classList.remove('on');interval();assert.ok(!document.body.classList.contains('df-ready-full'),'Leaving Prontas must release fullscreen');
 ready.classList.add('on');interval();assert.ok(document.body.classList.contains('df-ready-full'),'Returning to Prontas must recover fullscreen');
}
function testTeamCollapse(){
 const nodes=new Map(),docEvents={},winEvents={};let interval=null;
 const body={id:'dfCloudTeamBody',children:[],classList:classes()};
 const box={id:'dfOpTeamCloud',children:[body],classList:classes(),insertBefore(el,next){el.parentElement=this;this.children.unshift(el);nodes.set(el.id,el)},querySelector(){return null}};
 const formula={id:'dfFormulaOps',classList:classes('on')};
 nodes.set(box.id,box);nodes.set(formula.id,formula);
 const document={
  readyState:'complete',hidden:false,
  getElementById:id=>nodes.get(id)||null,
  createElement:()=>({id:'',innerHTML:'',setAttribute(){},remove(){nodes.delete(this.id)}}),
  addEventListener:(name,fn)=>(docEvents[name]??=[]).push(fn),
  head:{appendChild:el=>nodes.set(el.id,el)}
 };
 const window={addEventListener:(name,fn)=>(winEvents[name]??=[]).push(fn),DFOpCloud:{team:()=>({name:'DF EXTRUSOR',role:'owner'}),mountTeam:()=>true}};
 const sessionStorage={getItem:()=>null,setItem(){}};
 const localStorage={getItem:()=>null};
 class MutationObserver{observe(){}disconnect(){}}
 vm.runInNewContext(fs.readFileSync('op-team-panel-collapse-v1.js','utf8'),{document,window,MutationObserver,setInterval:fn=>(interval=fn,1),setTimeout:fn=>(fn(),1),clearTimeout(){},sessionStorage,localStorage,console});
 let toggle=nodes.get('dfTeamCollapseToggle');
 assert.ok(toggle,'Toggle must exist after first mount');
 assert.ok(box.children.includes(body),'Original team details must be preserved');
 assert.ok(box.classList.contains('dfTeamCollapsed'),'Team begins minimized');
 toggle.onclick();assert.ok(!box.classList.contains('dfTeamCollapsed'),'Click opens team details');
 nodes.delete('dfTeamCollapseToggle');box.children=box.children.filter(x=>x!==toggle);
 interval();toggle=nodes.get('dfTeamCollapseToggle');
 assert.ok(toggle,'Lost toggle must be restored without reloading app');
 assert.ok(box.children.includes(body),'Details must remain untouched by recovery');
}
function staticGuards(){
 const cloud=fs.readFileSync('op-cloud-team-v3.js','utf8');
 const sw=fs.readFileSync('sw.js','utf8');
 const html=fs.readFileSync('index.html','utf8');
 assert.match(cloud,/function setTeamContent\(/,'Team content must use stable wrapper');
 const renderTeamSource=cloud.slice(cloud.indexOf('function renderTeam(){'),cloud.indexOf('function mountTeam(){'));
 assert.doesNotMatch(renderTeamSource,/box\.innerHTML=/,'Do not delete team toggle inside renderTeam');
 for(const file of ['formula-op-relatorio.js','op-team-panel-collapse-v1.js','op-ready-fullscreen-v1.js','op-monthly-photo-editor-v1.js','op-ui-integrity-v1.js']){
  assert.ok(sw.includes("'./"+file+"'"),file+' must be available offline');
  assert.ok(html.includes(file+'?v='),file+' must be loaded in versioned app');
 }
 const guard=fs.readFileSync('op-ui-integrity-v1.js','utf8');
 assert.match(guard,/reloadMissing/,'Critical modules must have controlled retry');
}
testReadyFullscreen();testTeamCollapse();staticGuards();
console.log('Prontas, equipe, offline e autorrecuperação: testes passaram.');

