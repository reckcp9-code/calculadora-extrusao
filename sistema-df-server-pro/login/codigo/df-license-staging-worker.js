// Worker de diagnóstico de licenças (staging). Não recebe keys nem altera licenças.
// Cloudflare Worker ES module; binding D1: LICENSE_DB => df-extrusor-licencas.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {'content-type':'application/json','cache-control':'no-store'};
    if (request.method !== 'GET' || url.pathname !== '/health') {
      return new Response(JSON.stringify({ok:false,error:'not_found'}), {status:404,headers});
    }
    try {
      const r = await env.LICENSE_DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='licenses'").first();
      return new Response(JSON.stringify({ok:!!r,service:'df-license-staging'}),{status:r?200:503,headers});
    } catch (_) {
      return new Response(JSON.stringify({ok:false,error:'database_unavailable'}),{status:503,headers});
    }
  }
};
