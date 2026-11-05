# Auditoria de limpeza — DF Extrusor Pro (04/11/2026)

## Estado desta branch
- 555 arquivos após remoção de 41 scripts experimentais da raiz (commit 9be8c9a3532799c8b5bf26a333877972cc5159c9).
- 315 arquivos na raiz; 164 em sistema-df-server-pro; 17 em painel-administrativo; 25 em teste; 16 em extrusora; 7 em tests; 7 em .github; 4 em secure-frontend.
- 376 conteúdos SHA únicos e 179 arquivos excedentes com conteúdo idêntico a outro arquivo (inclui cópias de auditoria e Central Técnica).
- As páginas gerar-acesso.html e painel-administrativo-df.html já apontam parte dos scripts para painel-administrativo/codigo-ativo-auditoria/.
- Versão publicada/main não foi modificada nesta auditoria.

## Executado
- Remoção de 50 páginas HTML antigas/TV/teste em commit 71183bd493abd44d8f13a2159a20ffbbaeee8926.
- Remoção de 22 scripts antigos de teste em commit 7d805dc66ecc8fba19028aa0204cfa2ba67f3bf4.
- Remoção de duas cópias desatualizadas op-producao.html e sw.js.
- Ajustes de 23 referências no painel administrativo.
- Remoção da página antiga gerador-restaurado-20261009.html.
- Remoção de 41 scripts experimentais *test*/*teste* da raiz, após verificar ausência de referência literal nas principais páginas, app-bundle.js, sw.js e workflows.

## Pendente antes de excluir as originais
1. Mapear referências de TODOS os JS e URLs montados dinamicamente, além de HTML e Service Worker.
2. Resolver o carregamento do PWA e as rotas públicas antes de mover index.html, sw.js, manifest.webmanifest, CNAME e entrypoints. Não mover esses arquivos só por organização.
3. Consolidar 179 arquivos de conteúdo duplicado, mantendo uma rota funcional; cópias não devem ser apagadas sem teste de caminhos.
4. Auditar os 25 arquivos de teste/ e os 16 de extrusora/ antes de removê-los.
5. Rodar os testes CI de sincronização, licença, OP, produção e testes manuais em dois aparelhos.
6. Verificar Cloudflare Pages/Workers e configurações de deploy antes de fazer merge na main.

## Segurança
- Manter a branch de backup backup-main-antes-migracao-pastas-20261104.
- Não publicar nem apagar dados D1/R2 nesta fase.
- Não considerar a varredura estática uma garantia de ausência de uso; imports dinâmicos, scripts injetados e rotas antigas exigem teste real.
