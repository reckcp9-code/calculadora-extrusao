# Inventário completo de organização do código — 2026-11-03

## Resultado confirmado

- Foram criadas **323 cópias adicionais** de arquivos da raiz, categorizadas nas pastas `sistema-df-server-pro/` e `painel-administrativo/`, em um único commit Git (`335640bc9ccc9b8e10da9d25f6c2161ec71df8b7`).
- Junto com as cópias de etapas anteriores, **todos os 325 arquivos da raiz têm uma cópia com SHA idêntico dentro das duas pastas**. Isso foi conferido pela árvore Git após o commit.
- Não foram movidos nem excluídos arquivos executáveis da raiz. **Essas cópias são de preparação e ainda não são os caminhos executados pelo aplicativo.**
- Não houve publicação nem alterações em `main`, Workers, D1 ou R2.

## Organização

- `sistema-df-server-pro/telas/codigo/`: entradas e interface.
- `sistema-df-server-pro/formulacao/{codigo,materiais,dados-salvos}/`: formulações.
- `sistema-df-server-pro/producao/{ops,dados-salvos,sincronizacao,relatorios}/`: produção.
- `sistema-df-server-pro/calculos/`: cálculos de extrusão e custos da calculadora.
- `sistema-df-server-pro/infraestrutura/{codigo,acesso,backup}/`: infraestrutura e autenticação.
- `sistema-df-server-pro/documentacao/`: documentação.
- `painel-administrativo/{interface,acesso-e-licencas,equipes-e-permissoes,publicacao}/`: administração.

## Pendências bloqueantes para exclusão da raiz

1. Inventariar referências de HTML, JS, CSS, service worker, manifests, URLs públicas, Workers e GitHub Actions.
2. Ajustar os carregadores para caminhos novos ou manter entradas de compatibilidade na raiz. `index.html`, `sw.js`, `sw-policy.js`, `manifest.webmanifest`, `CNAME` e entradas do painel podem exigir caminhos estáveis.
3. Testar login, chave, acesso, sincronização entre aparelhos, OPs, fotos R2, dados D1, formulações, PDFs e painel.
4. Fazer a integração com `main` somente após testes. Excluir os duplicados apenas quando nenhum carregador depender dos caminhos originais.

**Não confundir organização completa das cópias com migração funcional concluída.**
