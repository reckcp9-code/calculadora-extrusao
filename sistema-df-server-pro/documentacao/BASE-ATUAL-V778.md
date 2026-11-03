# Base atual do DF Extrusor — v1.0.778

Esta branch foi criada diretamente do commit `b58b82285ce50ac6ec2f16c427797218a105eb61` da `main` em 2026-11-03.

O arquivo `app-version.json` nessa base declara a versão **1.0.778**. A branch é uma fotografia do código da versão principal naquele commit, **não uma prova da versão efetivamente carregada em cada celular**.

**Objetivo:** usar esta base para a migração às pastas `sistema-df-server-pro/` e `painel-administrativo/`, mantendo as telas e recursos atuais.

**Não usar a branch antiga `organizacao-frontend-v774-20261103` para substituir a `main`**, pois a branch antiga pode omitir correções posteriores.

**Não apagar indiscriminadamente arquivos com números antigos no nome:** o carregamento da v1.0.778 pode depender desses arquivos. É necessário atualizar imports, manifests, service worker e caminhos do painel e testar antes de remover originais.

Dados operacionais em Cloudflare D1 e fotos no R2 não estão nesta branch. Git mantém histórico de commits anteriores mesmo após remover arquivos da árvore atual.
