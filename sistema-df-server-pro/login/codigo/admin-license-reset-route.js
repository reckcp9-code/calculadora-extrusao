/**
 * Rota POST /admin/licenses/reset — módulo de integração para Worker existente.
 * IMPORTANTE: não publicar isoladamente. A função authorizeAdmin precisa ser
 * conectada à autenticação REAL do Worker df-extrusor-api.
 * O body jamais pode determinar ownerId, actorId ou permissões.
 */
const headers = {'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const respond = (payload,status=200) => new Response(JSON.stringify(payload),{status,headers});

export async function handleLicenseReset(request,env,{authorizeAdmin}={}) {
  if(request.method!=='POST') return respond({ok:false,error:'method_not_allowed'},405);
  if(!env.LICENSE_DB) return respond({ok:false,error:'license_database_unavailable'},503);
  if(typeof authorizeAdmin!=='function') return respond({ok:false,error:'admin_auth_not_configured'},503);
  // O verificador DEVE consultar o segredo/sessão do servidor, nunca confiar no body.
  let principal;
  try {principal=await authorizeAdmin(request,env)}catch(_){return respond({ok:false,error:'unauthorized'},401)}
  if(!principal?.id||principal?.canResetLicenses!==true)return respond({ok:false,error:'forbidden'},403);
  let body;
  try {body=await request.json()}catch(_){return respond({ok:false,error:'invalid_json'},400)}
  const licenseId=typeof body?.licenseId==='string'?body.licenseId.trim():'';
  if(!licenseId||licenseId.length>128)return respond({ok:false,error:'license_id_required'},400);
  try {
    const existing=await env.LICENSE_DB.prepare('SELECT license_id,owner_id,status,generation FROM licenses WHERE license_id=?').bind(licenseId).first();
    if(!existing)return respond({ok:false,error:'license_not_found'},404);
    // Uma licença pausada permanece pausada. Reset não concede acesso a licenças suspensas.
    if(existing.status==='revoked')return respond({ok:false,error:'license_revoked'},409);
    const nextGeneration=Number(existing.generation)+1;
    await env.LICENSE_DB.batch([
      env.LICENSE_DB.prepare('UPDATE licenses SET generation=?,updated_at=CURRENT_TIMESTAMP WHERE license_id=? AND generation=?').bind(nextGeneration,licenseId,existing.generation),
      env.LICENSE_DB.prepare('UPDATE license_devices SET revoked_at=CURRENT_TIMESTAMP WHERE license_id=? AND revoked_at IS NULL').bind(licenseId),
      env.LICENSE_DB.prepare('INSERT INTO license_audit(license_id,action,actor_id,details) VALUES(?,?,?,?)').bind(licenseId,'reset',String(principal.id),JSON.stringify({generation:nextGeneration}))
    ]);
    return respond({ok:true,licenseId,resetPending:true,generation:nextGeneration,message:'KEY liberada para nova ativação. Dados do proprietário preservados.'});
  } catch(_) {return respond({ok:false,error:'reset_failed'},500)}
}

/**
 * Integração obrigatória:
 * 1. O Worker atual deve validar a KEY no provedor existente.
 * 2. A ativação deve vincular a geração atual ao primeiro dispositivo autorizado.
 * 3. Sessões antigas devem ser recusadas em toda rota autenticada.
 * 4. O painel deve enviar licenseId real do D1 (não keyId legado).
 * 5. Enquanto houver dois registros de vínculo (legado e D1), o reset deve
 *    revogar ambos de forma coordenada. Não habilitar em produção antes disso.
 */
