/* DF EXTRUSOR: recover existing team ownership using the active license identity.
   This Worker never accepts a team ID or an owner key from the browser. */
const MAIN_API='https://df-extrusor-api.reck-cp9.workers.dev';
const ORIGINS=new Set([
 'https://app.dfextrusor.com.br',
 'https://dfextrusor.com.br',
 'https://www.dfextrusor.com.br',
 'https://reckcp9-code.github.io'
]);
function respond(data,status,origin){
 const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','vary':'Origin'};
 if(ORIGINS.has(origin)){headers['access-control-allow-origin']=origin;headers['access-control-allow-methods']='POST, OPTIONS';headers['access-control-allow-headers']='Content-Type';}
 return new Response(JSON.stringify(data),{status,headers});
}
function decodeToken(token){
 try{
  const part=String(token||'').split('.')[0].replace(/-/g,'+').replace(/_/g,'/');
  const binary=atob(part.padEnd(Math.ceil(part.length/4)*4,'='));
  const data=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(data));
 }catch(e){return null}
}
async function restore(request,env,origin){
 let body;
 try{const s=await request.text();if(s.length>6000)return respond({ok:false,error:'Requisição muito grande'},413,origin);body=JSON.parse(s)}catch(e){return respond({ok:false,error:'Dados inválidos'},400,origin)}
 const credential=String(body?.credential||'').trim();
 const deviceId=String(body?.deviceId||'').trim();
 if(credential.length<12||credential.length>2048||deviceId.length<8||deviceId.length>160)
  return respond({ok:false,error:'Identificação de acesso incompleta'},400,origin);
 let original;
 try{
  original=await env.AUTH.fetch(MAIN_API+'/access/session',{
   method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':deviceId,'Origin':origin},
   body:JSON.stringify({credential,deviceId}),cache:'no-store',redirect:'error'
  });
 }catch(e){const debug=credential==='INVALID-CREDENTIAL-CI-ONLY'?String(e?.name||'Error')+': '+String(e?.message||e).slice(0,200):undefined;return respond({ok:false,error:'Serviço de licença temporariamente indisponível',debug},503,origin)}
 let auth={};
 try{auth=await original.json()}catch(e){}
 if(!original.ok||auth.ok===false||!auth.token)
  return respond({ok:false,error:'Licença não validada no aparelho atual'},401,origin);
 // The token is freshly obtained from the trusted main API, never from the client.
 const token=decodeToken(auth.token),owner=String(token?.owner||'').trim();
 if(!/^[A-Za-z0-9_-]{43}$/.test(owner))
  return respond({ok:false,error:'Identificação da sessão incompatível com recuperação automática'},409,origin);
 if(token.deviceId&&String(token.deviceId)!==deviceId)
  return respond({ok:false,error:'Sessão pertence a outro aparelho'},403,origin);
 const matching=await env.DB.prepare(
  "SELECT DISTINCT k.id AS key_id,i.identity_hash FROM access_keys k "+
  "JOIN access_credentials c ON c.key_id=k.id AND c.active=1 "+
  "JOIN access_identities i ON i.key_id=k.id "+
  "WHERE k.status='used' AND k.device_id=? AND c.device_id=?"
 ).bind(deviceId,deviceId).all();
 const licenses=matching.results||[];
 if(licenses.length!==1)
  return respond({ok:false,error:'Acesso não identificado de forma única; não alterei equipes'},409,origin);
 const identityHash=String(licenses[0].identity_hash||'');
 if(identityHash.length<32)return respond({ok:false,error:'Licença sem identidade permanente'},409,origin);
 const owned=await env.DB.prepare(
  "SELECT team_id,name,area,owner_key FROM op_teams "+
  "WHERE owner_identity_hash=? AND area IN ('extrusao','producao') ORDER BY area"
 ).bind(identityHash).all();
 const teams=owned.results||[];
 if(!teams.length)return respond({ok:true,teams:[],changed:0},200,origin);
 if(teams.length>3)return respond({ok:false,error:'Associação ambígua; equipes preservadas'},409,origin);
 const stmts=[];let changed=0;
 for(const t of teams){
  if(t.owner_key===owner)continue;
  const old=await env.DB.prepare(
   "SELECT display_name,joined_at FROM op_team_members WHERE team_id=? AND owner_key=? AND role='owner'"
  ).bind(t.team_id,t.owner_key).first();
  if(!old)return respond({ok:false,error:'Registro de proprietário incompleto; equipes preservadas'},409,origin);
  // All statements in DB.batch commit atomically, and only for the license's teams.
  stmts.push(env.DB.prepare(
   "INSERT INTO op_team_members(team_id,owner_key,role,joined_at,display_name) VALUES(?,?,'owner',?,?) "+
   "ON CONFLICT(team_id,owner_key) DO UPDATE SET role='owner',display_name=excluded.display_name"
  ).bind(t.team_id,owner,String(old.joined_at||new Date().toISOString()),String(old.display_name||'DF PRO')));
  stmts.push(env.DB.prepare(
   "UPDATE op_teams SET owner_key=?,updated_at=? WHERE team_id=? AND owner_identity_hash=? AND owner_key=?"
  ).bind(owner,new Date().toISOString(),t.team_id,identityHash,t.owner_key));
  stmts.push(env.DB.prepare(
   "DELETE FROM op_team_members WHERE team_id=? AND owner_key=? AND role='owner'"
  ).bind(t.team_id,t.owner_key));
  changed++;
 }
 if(stmts.length){
  try{await env.DB.batch(stmts)}
  catch(e){return respond({ok:false,error:'Falha na atualização segura da propriedade; tente novamente'},503,origin)}
 }
 // A second read confirms the binding really belongs to the authenticated owner.
 const verified=await env.DB.prepare(
  "SELECT t.team_id,t.name,t.area,m.display_name FROM op_teams t JOIN op_team_members m "+
  "ON m.team_id=t.team_id AND m.owner_key=t.owner_key AND m.role='owner' "+
  "WHERE t.owner_identity_hash=? AND t.owner_key=? AND t.area IN ('extrusao','producao')"
 ).bind(identityHash,owner).all();
 if((verified.results||[]).length!==teams.length)
  return respond({ok:false,error:'Validação de propriedade incompleta; verifique antes de sincronizar'},503,origin);
 return respond({ok:true,teams:(verified.results||[]).map(t=>({
  teamId:String(t.team_id),name:String(t.name),area:String(t.area),role:'owner',displayName:String(t.display_name||'DF PRO')
 })),changed},200,origin);
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin')||'';
  if(request.method==='GET'&&url.pathname==='/health')
   return respond({ok:true,service:'df-team-license-restore',version:1},200,origin);
  if(!ORIGINS.has(origin))return respond({ok:false,error:'Origem não autorizada'},403,origin);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
   'access-control-allow-origin':origin,'access-control-allow-methods':'POST, OPTIONS',
   'access-control-allow-headers':'Content-Type','cache-control':'no-store','vary':'Origin'
  }});
  if(request.method!=='POST'||url.pathname!=='/restore')
   return respond({ok:false,error:'Rota não encontrada'},404,origin);
  try{return await restore(request,env,origin)}
  catch(e){return respond({ok:false,error:'Falha temporária na recuperação; os dados das equipes foram preservados'},503,origin)}
 }
};
