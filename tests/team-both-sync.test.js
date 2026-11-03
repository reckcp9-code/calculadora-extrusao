'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('team-license-restore-v1.js','utf8');
const values=new Map([
 ['df_auto_access_credential_v1','credential-test-123456789'],
 ['df_licenseauth_device_v1','device-test-123456789'],
 ['df_op_team_v1',JSON.stringify({teamId:'TEAM-EXTRUSION',role:'owner',name:'DF EXTRUSOR'})],
 ['df_producao_team_v2',JSON.stringify({teamId:'TEAM-PRODUCTION',role:'owner',name:'DF PRODUÇÃO'})],
 ['df_producao_cadastros_v1',JSON.stringify({Picote:{machines:['PICOTADEIRA USN'],products:['PRODUTO'],operators:['OPERADOR']}})]
]);
const events=[],jobs=[],later=[];
const localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
const sessionStorage={getItem:k=>k==='df_team_license_reloaded_once_v1'?'1':'TOKEN-CACHED',setItem(){},removeItem:k=>events.push('token-removed:'+k)};
const window={
 DFDeviceIdentity:{get:()=>values.get('df_licenseauth_device_v1')},
 DFOpCloud:{async refreshTeam(){jobs.push('formula-team')},async sync(){jobs.push('formula-photos');return true}},
 DFOpServerAuthority:{async sync(force,month){jobs.push('formula-records:'+month);return true}},
 DFTeamFormulasShared:{async sync(){jobs.push('formulas');return true}},
 DFProducaoEquipeOnline:{async pull(){jobs.push('production-history');return true}},
 DFRenderSavedProductionOps(){jobs.push('production-render')},
 dispatchEvent:e=>events.push(e.type),addEventListener(){}
};
let reloaded=false;
const environment={window,location:{reload(){reloaded=true}},document:{readyState:'complete',hidden:false,addEventListener(){}},navigator:{onLine:true},localStorage,sessionStorage,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail}},setTimeout(fn){later.push(fn);return 1},setInterval(){},console,fetch:async()=>({ok:true,json:async()=>({ok:true,changed:0,teams:[
 {teamId:'TEAM-EXTRUSION',area:'extrusao',role:'owner',name:'DF EXTRUSOR'},
 {teamId:'TEAM-PRODUCTION',area:'producao',role:'owner',name:'DF PRODUÇÃO'}
 ]})})};
vm.runInNewContext(script,environment);
(async()=>{
 for(let i=0;i<4&&later.length;i++)await later.shift()();
 await new Promise(r=>setImmediate(r));
 assert.ok(jobs.includes('formula-team'),'must reconnect formula team');
 assert.ok(jobs.includes('formulas'),'must download formula library');
 assert.ok(jobs.includes('formula-photos'),'must refresh photos');
 assert.ok(jobs.includes('production-history'),'must restore production');
 assert.ok(jobs.includes('production-render'),'must rebuild OP cards');
 assert.ok(jobs.filter(x=>x.startsWith('formula-records:')).length>=3,'must pull current and prior months');
 assert.ok(events.includes('token-removed:df_secure_token_v2'),'must renew old access token');
 assert.ok(events.includes('df-license-full-team-sync'),'must report both teams refreshed');
 assert.equal(reloaded,false,'already recovered team must not force reload');
 const authority=fs.readFileSync('op-server-authority-v1.js','utf8');
 assert.match(authority,/pendingPull\.push\(\{month,force:true\}\)/,'must queue every requested month');
 assert.match(authority,/pendingPull\.shift\(\)/,'must drain requested months');
 console.log('Both team sync and historical months validated.');
})().catch(e=>{console.error(e);process.exitCode=1});

