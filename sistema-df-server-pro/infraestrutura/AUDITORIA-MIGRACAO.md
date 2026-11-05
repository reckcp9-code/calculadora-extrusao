# Auditoria de migração — duas pastas finais

Data: 2026-11-03. Branch: `organizacao-frontend-v774-20261103`.

## Evidência verificada
- `index.html` é a entrada atual e carrega scripts da raiz, incluindo `app-bundle.js`, `performance-guard-v3.js`, `production-stability-v1.js`.
- `sw.js` mantém referências a scripts da raiz e também a componentes administrativos como `gerador-admin-pwa-v193.js`.
- `painel-administrativo-df.html` ainda está na raiz e referencia recursos relativos.
- A documentação foi separada em `painel-administrativo/` e `sistema-df-server-pro/`, mas os executáveis ainda NÃO foram migrados.

## Exclusões adicionais desta auditoria
- `legacy/op-smart-reader-v4.js.txt` — arquivo de código arquivado como texto.
- `docs/AUDITORIA-COMPLETA-20261002.md` — relatório histórico.

## Pastas que ainda não podem ser eliminadas sem validação
- `.github/`: workflows de publicação e testes, incluindo notificação de atualização.
- `tests/`: testes automatizados de OP, autenticação e sincronização.
- `secure-frontend/`: página de teste seguro antiga, mas o uso por URLs externas não foi verificado.
- `organizacao/`: histórico da limpeza e inventário; poderá ser incorporado a `sistema-df-server-pro/` depois.

## Para concluir a migração
1. Inventariar TODOS os imports, URLs, manifests, service workers e rotas do painel e do app.
2. Mover o código executável por grupos e atualizar referências e escopos, preservando as URLs públicas ou criando entradas compatíveis.
3. Executar testes automatizados e testes manuais de login, OPs, produção, formulação, D1/R2, painel e PWA.
4. Somente após validação, excluir as pastas antigas e integrar à branch principal.

**Esta auditoria não representa conclusão da migração. Não mesclar a branch automaticamente.**
