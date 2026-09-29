(function(){
'use strict';
if(window.DFOpScrollAnchorV1)return;window.DFOpScrollAnchorV1=true;
let anchor=null,lastInput=0,raf=0,obs=null,ro=null,restoring=false;
const $=id=>document.getElementById(id);
function keyFor(row){if(!row)return'';const cloud=row.querySelector?.('[data-cloud-open]')?.getAttribute('data-cloud-open');if(cloud)return'cloud:'+cloud;const view=row.querySelector?.('[data-view]')?.getAttribute('data-view');if(view)return'op:'+String(view).toUpperCase();const m=String(row.textContent||'').match(/DFOP-\d{8}-\d{6}-[A-Z0-9-]+/i);return m?'code:'+m[0].toUpperCase():''}
function candidates(){return Array.from(document.querySelectorAll('#dfCloudPhotosBox .dfCloudPhotoRow,#dfOkList .dfOpList,#dfPaneArchive .dfOpList'))}
function capture(){if(restoring)return;const rows=candidates();if(!rows.length)return;const vh=window.innerHeight||document.documentElement.clientHeight;let best=null,bestDist=1e9;for(const row of rows){const r=row.getBoundingClientRect();if(r.bottom<0||r.top>vh)continue;const k=keyFor(row);if(!k)continue;const d=Math.abs(Math.max(r.top,0));if(d<bestDist){bestDist=d;best={key:k,top:r.top,scrollY:window.scrollY||0,ts:Date.now()}}}if(best)anchor=best}
function findAnchor(){if(!anchor)return null;for(const row of candidates())if(keyFor(row)===anchor.key)return row;return null}
function restore(){if(!anchor||restoring)return;const row=findAnchor();if(!row)return;const r=row.getBoundingClientRect(),delta=r.top-anchor.top;if(Math.abs(delta)<2)return;restoring=true;try{window.scrollBy(0,delta)}catch(e){}requestAnimationFrame(()=>{restoring=false;capture()})}
function scheduleRestore(){requestAnimationFrame(()=>{restore();setTimeout(restore,40);setTimeout(restore,120)})}
function onUserInput(){lastInput=Date.now();capture()}
['touchstart','touchmove','pointerdown','wheel'].forEach(ev=>window.addEventListener(ev,onUserInput,{passive:true,capture:true}));
window.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(capture)},{passive:true});
function attach(){const root=$('dfFormulaOps')||document.body;if(!root)return;if(obs)try{obs.disconnect()}catch(e){};obs=new MutationObserver(muts=>{let relevant=false;for(const m of muts){const t=m.target;if(t?.closest?.('#dfCloudPhotosBox,#dfOkList,#dfPaneArchive,#dfOpTeamCloud,#dfFormulaOps')){relevant=true;break}}if(relevant){if(!anchor)capture();scheduleRestore()}});obs.observe(root,{childList:true,subtree:true});if(window.ResizeObserver){if(ro)try{ro.disconnect()}catch(e){};ro=new ResizeObserver(()=>{if(anchor)scheduleRestore()});['dfOpTeamCloud','dfCloudPhotosBox','dfOkList'].forEach(id=>{const el=$(id);if(el)ro.observe(el)})}}
// Bloqueia saltos programáticos grandes para o topo enquanto o usuário está rolando as listas de OP.
const nativeScrollTo=window.scrollTo.bind(window);
window.scrollTo=function(){let y;if(typeof arguments[0]==='object')y=Number(arguments[0]?.top);else y=Number(arguments[1]);const cur=window.scrollY||0;if(Number.isFinite(y)&&cur>350&&y<120&&Date.now()-lastInput<1800){return}return nativeScrollTo.apply(window,arguments)};
function boot(){capture();attach();setTimeout(()=>{capture();attach()},500);setTimeout(()=>{capture();attach()},1500)}
window.addEventListener('df-ui-ready',()=>setTimeout(boot,120));window.addEventListener('pageshow',()=>setTimeout(boot,120));document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="archive"],[data-pane="ok"],#dfFormTabOps'))setTimeout(()=>{capture();attach()},120)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();