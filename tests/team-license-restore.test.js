'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const workerCode=fs.readFileSync('.github/workers/df-team-license-restore-v1.js','utf8');
const frontend=fs.readFileSync('team-license-restore-v1.js','utf8');
const worker=new Function('fetch','Response','Request','TextDecoder','Uint8Array','atob',workerCode.replace('export default {','return {'))(globalThis.fetch,globalThis.Response,globalThis.Request,globalThis.TextDecoder,globalThis.Uint8Array,globalThis.atob);
const ORIGIN='https://app.dfextrusor.com.br';
function makeReq(origin=ORIGIN,deviceId='device-12345'){
 return new Request('https://df-team-license-restore-v1.reck-cp9.workers.dev/restore',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({credential:'TEST-CREDENTIAL-NOT-REAL',deviceId})});
}
function mockToken(owner,deviceId='device-12345'){
 return Buffer.from(JSON.stringify({owner,deviceId})).toString('base64url')+'.test-signature';
}
async function check(){
 assert.match(workerCode,/env\.AUTH\.fetch\(/,'Must authenticate via main Worker service binding');
 assert.match(workerCode,/owner_identity_hash=\?/,'Must use stable identity, not guessed device IDs');
 assert.match(workerCode,/JOIN access_credentials c ON c\.key_id=k\.id AND c\.active=1/,'Must require active access credential');
 assert.match(frontend,/df_producao_team_v2/,'Production team must be restored locally');
 assert.match(frontend,/df_op_team_v1/,'Formulation team must be restored locally');
 assert.match(frontend,/df_prod_team_explicit_exit_v1/,'Respect explicit leave from production team');
 const health=await worker.fetch(new Request('https://x/health'),{});
 assert.equal(health.status,200);
 const invalid=await worker.fetch(makeReq('https://evil.example'),{AUTH:{fetch(){throw Error('Must not be used')}}});
 assert.equal(invalid.status,403,'Invalid origin blocked');
 let dbCalls=0;
 const denied=await worker.fetch(makeReq(),{AUTH:{fetch:async()=>new Response(JSON.stringify({ok:false}),{status:401})},DB:{prepare(){dbCalls++;throw Error('Must not reach DB')}}});
 assert.equal(denied.status,401);assert.equal(dbCalls,0);
 const owner='A'.repeat(43),original='B'.repeat(43),identity='C'.repeat(43);
 const teams=[{team_id:'TEAM-FORM',name:'DF EXTRUSOR',area:'extrusao',owner_key:original},{team_id:'TEAM-PROD',name:'DF PRODUÇÃO',area:'producao',owner_key:original}];
 let batchCalls=0;
 const DB={
  prepare(sql){
   return{bind(...args){
    return {
     async all(){
      if(sql.includes('SELECT DISTINCT k.id'))return{results:[{key_id:771,identity_hash:identity}]};
      if(sql.includes('SELECT team_id,name,area,owner_key FROM op_teams'))return{results:teams.map(t=>({...t}))};
      if(sql.includes('SELECT t.team_id,t.name,t.area,m.display_name'))return{results:teams.filter(t=>t.owner_key===owner).map(t=>({...t,display_name:'DF PRO'}))};
      throw Error('Unexpected query '+sql);
     },
     async first(){
      if(sql.includes('SELECT display_name,joined_at'))return{display_name:'DF PRO',joined_at:'2026-10-25'};
      throw Error('Unexpected lookup '+sql);
     },
     sql,args
    };
   }}
  },
  async batch(stmts){
   assert.equal(stmts.length,6);
   batchCalls++;
   for(const stmt of stmts)if(stmt.sql.startsWith('UPDATE op_teams')){
    const [, ,id]=stmt.args;const t=teams.find(t=>t.team_id===id);assert.ok(t);t.owner_key=owner;
   }
   return stmts.map(()=>({success:true}));
  }
 };
 const auth={fetch:async()=>new Response(JSON.stringify({ok:true,token:mockToken(owner)}),{status:200})};
 const response=await worker.fetch(makeReq(),{DB,AUTH:auth});
 assert.equal(response.status,200);
 const json=await response.json();assert.equal(json.ok,true);assert.equal(json.changed,2);
 assert.deepEqual(json.teams.map(x=>x.area).sort(),['extrusao','producao']);
 assert.equal(batchCalls,1);
 assert.ok(json.teams.every(x=>x.role==='owner'));
 const repeat=await worker.fetch(makeReq(),{DB,AUTH:auth});
 assert.equal(repeat.status,200);
 assert.equal((await repeat.json()).changed,0,'Recovery must be idempotent');
 assert.equal(batchCalls,1);
 const bad=await worker.fetch(makeReq(),{DB,AUTH:{fetch:async()=>new Response(JSON.stringify({ok:true,token:mockToken('invalid')}))}});
 assert.equal(bad.status,409,'Must refuse unexpected token owner format');
 console.log('Team/license recovery tests passed: auth, stable identity, idempotence and ownership.');
}
check().catch(e=>{console.error(e);process.exitCode=1});

