# Telas e carregamento

## Entrada atual identificada no código
1. `index.html` inicializa a página e faz fetch de `app-shell.html` com parâmetro BUILD.
2. `app-shell.html` contém HTML/CSS de layout, abas e componentes.
3. `index.html` injeta scripts, incluindo `app-bundle.js` e `performance-guard-v3.js`.
4. `app.html` redireciona para a entrada raiz.

## Arquivos de interface relacionados
- `home-polish-v2.js`: ajustes da página inicial
- `ui-consistency-v1.js`: consistência de interface
- `sw.js`, `sw-policy.js`, `pwa-update.js`: cache, service worker e atualização

## Atenção
Na inspeção, `app-version.json` e o nome do cache em `sw.js` apontam v774, mas `BUILD_VERSION` em `sw.js` e o import de `sw-policy.js` ainda referenciam v771. Isso requer análise do fluxo antes de qualquer mudança.

Os arquivos `teste-*.html`, `preview-*.html` e `legacy/` podem conter telas anteriores. Não excluir sem verificar referências e uso real.
