// DF Extrusor — módulo de licenças para Cloudflare Worker (STAGING).
// Requer binding env.LICENSE_DB (D1 df-extrusor-licencas).
// Este módulo NÃO emite licença: a verificação da key deve ocorrer pelo provedor
// atual no backend antes de chamar registerVerifiedLicense.
// Nunca chamar registerVerifiedLicense diretamente a partir de uma rota pública.

const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const fingerprint = async key => {
  const bytes=new TextEncoder().encode(key);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
};

export async function registerVerifiedLicense(env,{key,ownerId,licenseId,deviceId}) {
  if(!env.LICENSE_DB||!key||!ownerId||!licenseId||!deviceId) throw new Error('Dados de ativação incompletos');
  const fp=await fingerprint(key);
  const existing=await env.LICENSE_DB.prepare('SELECT license_id,owner_id,status,generation FROM licenses WHERE key_fingerprint=?').bind(fp).first();
  if(existing && (existing.owner_id!==ownerId || existing.license_id!==licenseId)) throw new Error('Licença já vinculada a outro proprietário');
  if(existing?.status!=='active' && existing) return {ok:false,reason:existing.status};
  await env.LICENSE_DB.prepare('INSERT OR IGNORE INTO owners(owner_id) VALUES(?)').bind(ownerId).run();
  await env.LICENSE_DB.prepare("INSERT OR IGNORE INTO licenses(license_id,owner_id,key_fingerprint,status) VALUES(?,?,?,'active')").bind(licenseId,ownerId,fp).run();
  // Regra: somente um aparelho ativo por licença. Depois do reset,
  // a primeira ativação validada assume o vínculo, sem alterar owner_id.
  // A decisão ocorre no SQL, evitando duas ativações simultâneas.
  const claim=await env.LICENSE_DB.prepare(`
    INSERT INTO license_devices(license_id,device_id,generation,revoked_at)
    SELECT l.license_id,?,l.generation,NULL FROM licenses l
    WHERE l.license_id=? AND l.status='active'
      AND NOT EXISTS (
        SELECT 1 FROM license_devices d WHERE d.license_id=l.license_id
          AND d.generation=l.generation AND d.revoked_at IS NULL
          AND d.device_id<>?
      )
    ON CONFLICT(license_id,device_id) DO UPDATE SET
      generation=excluded.generation,revoked_at=NULL,authorized_at=CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM license_devices d WHERE d.license_id=excluded.license_id
        AND d.generation=excluded.generation AND d.revoked_at IS NULL
        AND d.device_id<>excluded.device_id
    )
  `).bind(deviceId,licenseId,deviceId).run();
  const active=await env.LICENSE_DB.prepare(
    'SELECT d.generation,l.owner_id FROM license_devices d JOIN licenses l ON l.license_id=d.license_id WHERE d.license_id=? AND d.device_id=? AND d.generation=l.generation AND d.revoked_at IS NULL AND l.status=\'active\''
  ).bind(licenseId,deviceId).first();
  if(!active)return {ok:false,reason:'device_bound_elsewhere'};
  return {ok:true,ownerId:active.owner_id,licenseId,generation:active.generation};
}

export async function licenseState(env,{licenseId,deviceId,generation}) {
  const r=await env.LICENSE_DB.prepare('SELECT l.status,l.generation,d.revoked_at,d.generation AS device_generation FROM licenses l LEFT JOIN license_devices d ON d.license_id=l.license_id AND d.device_id=? WHERE l.license_id=?').bind(deviceId,licenseId).first();
  if(!r)return json({ok:false,reason:'not_found'},401);
  if(r.status==='paused')return json({ok:false,paused:true},423);
  if(r.status!=='active'||r.device_generation==null||r.revoked_at!=null||Number(r.device_generation)!==Number(r.generation)||Number(r.generation)!==Number(generation))return json({ok:false,revoked:true},410);
  return json({ok:true});
}

// Apenas rotas administrativas autenticadas e autorizadas podem chamar esta função.
// O reset revoga sessões, mas não apaga owners, equipes ou dados operacionais.
export async function adminLicenseAction(env,{licenseId,action,actorId}) {
  // actorId é dado de auditoria, não uma prova de autorização.\n  // A rota chamadora DEVE verificar a sessão e a permissão de administrador.\n  if(!actorId||!['pause','resume','reset'].includes(action))throw new Error('Ação inválida');
  const row=await env.LICENSE_DB.prepare('SELECT status FROM licenses WHERE license_id=?').bind(licenseId).first();
  if(!row) return {ok:false,reason:'not_found'};
  if(action==='pause') await env.LICENSE_DB.prepare("UPDATE licenses SET status='paused',updated_at=CURRENT_TIMESTAMP WHERE license_id=?").bind(licenseId).run();
  if(action==='resume') await env.LICENSE_DB.prepare("UPDATE licenses SET status='active',updated_at=CURRENT_TIMESTAMP WHERE license_id=?").bind(licenseId).run();
  if(action==='reset'){
    await env.LICENSE_DB.prepare('UPDATE licenses SET generation=generation+1,updated_at=CURRENT_TIMESTAMP WHERE license_id=?').bind(licenseId).run();
    await env.LICENSE_DB.prepare('UPDATE license_devices SET revoked_at=CURRENT_TIMESTAMP WHERE license_id=? AND revoked_at IS NULL').bind(licenseId).run();
  }
  await env.LICENSE_DB.prepare('INSERT INTO license_audit(license_id,action,actor_id) VALUES(?,?,?)').bind(licenseId,action,actorId).run();
  return {ok:true};
}
