# Plano de migração dos carregadores — DF Extrusor

## Estado auditado
- A branch organizada contém 322 arquivos na raiz; 320 possuem cópias idênticas em subpastas e 2 são documentos de manutenção.
- **Não apagar a raiz ainda:** `index.html`, `app-shell.html`, `painel-administrativo-df.html`, `sw.js`, manifests e demais páginas ainda carregam scripts com caminhos `./arquivo.js`.
- `sw.js` contém dezenas de referências a scripts da raiz; o cache PWA precisa ser migrado em conjunto com os imports.
- `index.html` referencia diretamente `device-identity.js`, `ios-reinstall-bridge.js`, `access-recovery-v1.js`, `auth-self-heal-v1.js` e assets da raiz.
- `painel-administrativo-df.html` referencia scripts administrativos `gerador-*.js` na raiz.
- Páginas TV foram removidas apenas da branch organizada; backups e `main` não foram alterados.

## Sequência de migração
1. **Inventário completo de referências**: inspecionar HTML, JS com import dinâmico, service worker, CSS, manifests, rotas, caminhos de imagem, links de instalação e workflows. Fazer mapa arquivo de origem -> arquivo no módulo.
2. **Carregamento inicial**: preservar rotas públicas estáveis ou criar redirecionamentos/aliases. Migrar `index.html`, `app-shell.html`, `app.html`, `licenca.html`, `acessar.html`, `instalar.html`, `op-producao.html`, `sacolas.html`, `curso.html` e painel.
3. **Service worker/PWA**: atualizar precache, escopo, manifests e estratégia de invalidação; evitar que iPhones existentes fiquem presos em assets antigos.
4. **Scripts e módulos**: reescrever `src`, `href`, `importScripts`, `fetch`, imports relativos e URLs montadas em JS; garantir que um módulo exista uma vez só no runtime.
5. **Login e Dados do Dono**: integrar módulos ao runtime e testar key nova, existente, pausada, reativada, reset, novo celular e autorização no servidor.
6. **Produção/Formulação**: testar OPs, pendentes/prontas, prevenção de duplicidade, fotos R2, total mensal D1, sincronização sem dono online e isolamento de equipes.
7. **PDFs e painel**: verificar gerador ativo de cada relatório e remover variantes antigas somente após confirmar que não são referenciadas.
8. **Implantação controlada**: validar primeiro em ambiente de teste; publicar com possibilidade de rollback; conferir app no iPhone e operadores.
9. **Exclusão final**: somente após os testes, remover duplicatas da raiz e branches antigas não necessárias. Manter as duas reservas 1.0.778 e 1.0.620.1 e a branch ativa de publicação.

## Limite desta etapa
Esta é a auditoria e o plano de migração; **não é prova de testes funcionais nem migração já publicada**. Nenhum dado de D1/R2 deve ser excluído por esta limpeza de código.
