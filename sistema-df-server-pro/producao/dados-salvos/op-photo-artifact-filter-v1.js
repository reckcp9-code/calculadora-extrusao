(function(){
'use strict';
if(window.DFOpPhotoArtifactFilterV1)return;window.DFOpPhotoArtifactFilterV1=true;
var nativeFetch=window.fetch.bind(window);
function technical(v){v=String(v||'').trim().toUpperCase();return /^(?:DFOPMETA\d+\.|DFMETA-|DFMASTER\d*[.-]|DFOPNAME\d+\.|DFNAME\d*-)/.test(v)}
function fake(p){return !!(p&&(technical(p.id)||technical(p.qr)||technical(p.sourceId)||technical(p.source)))}
window.fetch=async function(input,init){var res=await nativeFetch(input,init),url='';try{url=typeof input==='string'?input:String(input&&input.url||'')}catch(e){}if(url.indexOf('/op/photo/list')<0||!res.ok)return res;try{var data=await res.clone().json();if(!data||!Array.isArray(data.photos))return res;var clean=data.photos.filter(function(p){return !fake(p)});if(clean.length===data.photos.length)return res;data.photos=clean;var h=new Headers(res.headers);h.delete('content-length');h.delete('content-encoding');h.set('content-type','application/json; charset=utf-8');return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers:h})}catch(e){return res}};
function purgeLocal(){try{var k='df_formula_ops_auto_v2',a=JSON.parse(localStorage.getItem(k)||'[]');if(Array.isArray(a)){var b=a.filter(function(x){return !fake(x)});if(b.length!==a.length)localStorage.setItem(k,JSON.stringify(b))}}catch(e){}}
purgeLocal();window.addEventListener('pageshow',purgeLocal);window.addEventListener('df-op-remote-merged',purgeLocal);
})();