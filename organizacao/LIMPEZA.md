# Inventário inicial e plano de limpeza

Repositório analisado: `reckcp9-code/calculadora-extrusao`, branch `main`.
Inventário inicial da árvore: 514 entradas, incluindo 67 arquivos HTML e 414 JavaScript (contagem por extensão; não significa que sejam obsoletos).

## Candidatos para auditoria, NÃO para exclusão automática
- `legacy/`
- `teste-*.html`, `preview-*.html`
- `op-producao-teste-v*.html`
- módulos `*-test*.js` e `*-teste*.js`
- scripts com versões antigas no nome, mesmo que ainda sejam referenciados

## Procedimento antes de excluir
1. Inventariar referências de cada arquivo em HTML, JS, SW, manifest e workflows.
2. Identificar entrada publicada e rotas usadas por operadores e dono.
3. Comparar arquivos ativos com candidatos e testar comportamento em iPhone/PWA.
4. Separar somente arquivos comprovadamente sem uso, em branch de trabalho.
5. Testar carregamento, sincronização, offline, permissões, OPs e PDFs.
6. Publicar somente após validação; manter histórico para rollback.

**Estado:** documentação criada; nenhum arquivo antigo foi excluído ou movido.
