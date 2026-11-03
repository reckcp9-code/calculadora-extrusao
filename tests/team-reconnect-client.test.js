'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const code=fs.readFileSync('team-license-restore-v1.js','utf8');
const db=new Map([
 ['df_auto_access_credential_v1','credential-test-minimum-16'],
 ['df_licenseauth_device_v1','device-test-minimum-16'],
 ['df_op_team_v1',JSON.stringify({teamId:'TEAM-EXTRUSION',role:'owner',name:'DF EXTRUSOR'})],
 ['df_producao_team_v2',JSON.stringify({teamId:'TEAM-PRODUCTION',role:'owner',name:'DF PRODUÇÃO'})]
]);
const localStorage={getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,v),removeItem:k=>db.delete(k)};
const session=new Map();
const sessionStorage={getItem:k=>session.get(k)||null,setItem:(k,v)=>session.set(k,v)};
let calls=0,reloadCalls=0,requests=[],events=[];
const timers=[];
const window={
 DFDeviceIdentity:{get:()=>db.get('df_licenseauth_device_v1')},
 DFOpCloud:{async refreshTeam(){events.push('refresh-formula')}},
 DFProducaoEquipeOnline:{async pull(){events.push('refresh-production')}},
 addEventListener(){},dispatchEvent:e=>events.push(e.type)
};
const context={window,document:{readyState:'complete',hidden:false,addEventListener(){}},navigator:{onLine:true},localStorage,sessionStorage,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail}},setTimeout:fn=>{timers.push(fn);return 1},setInterval(){},location:{reload(){reloadCalls++}},console,fetch:async(url,opts)=>{
 calls++;requests.push({url,opts});return{ok:true,status:200,json:async()=>({ok:true,teams:[
  {teamId:'TEAM-EXTRUSION',area:'extrusao',name:'DF EXTRUSOR',role:'owner'},
  {teamId:'TEAM-PRODUCTION',area:'producao',name:'DF PRODUÇÃO',role:'owner',catalog:{updatedAt:'2026-11-03T02:17:20.482Z',verifiedAt:'2026-11-03T02:17:20.482Z',config:{Picote:{machines:['PICOTADEIRA USN','SACOLEIRA FLEX 900'],products:['SACOLA P'],operators:['VILSON']}}}}
 ],changed:2})};
}};
vm.runInNewContext(code,context);
assert.equal(calls,0,'Not called until scheduled');
async function flush(){for(let i=0;i<15;i++){const timer=timers.shift();if(!timer)break;await timer();await new Promise(r=>setImmediate(r))}}
(async()=>{
 await flush();
 assert.equal(calls,1,'Even with both teams cached, restore MUST verify ownership on server');
 assert.match(requests[0].url,/df-team-license-restore/);
 assert.equal(db.has('df_license_team_restored_v1'),true,'Must persist verification marker');
 assert.ok(events.includes('refresh-formula'),'Must refresh source of formula team');
 assert.ok(events.includes('refresh-production'),'Must refresh historical production from cloud');
 assert.equal(JSON.parse(db.get('df_producao_cadastros_v1')).Picote.machines[0],'PICOTADEIRA USN','Must restore machines from D1 snapshot');
 assert.ok(events.includes('df-producao-cadastros-sincronizados'),'Must refresh production catalogue widgets');
 assert.equal(window.DFTeamLicenseRestore.status().lastResult.catalogRecovered,true,'Must report catalogue recovery');
 assert.equal(reloadCalls,0,'No destructive reload needed for already cached teams');
 const status=window.DFTeamLicenseRestore.status();
 assert.equal(status.lastError,'');
 assert.deepEqual(Array.from(status.lastResult.teams).sort(),['extrusao','producao']);
 console.log('Client restore regression: cached teams still verify D1 and fetch historical records');
})().catch(e=>{console.error(e);process.exitCode=1});

