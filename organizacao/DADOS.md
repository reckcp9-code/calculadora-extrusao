# Dados e sincronização

## Camadas
- GitHub: código e histórico de commits; não é o banco de dados operacional.
- Cloudflare Workers: API do aplicativo, indicada no frontend como `https://df-extrusor-api.reck-cp9.workers.dev`.
- D1: dados estruturados, conforme arquitetura do projeto.
- R2: arquivos e fotos, conforme arquitetura do projeto.
- Cache/Service Worker: recursos da interface no dispositivo; não deve ser confundido com fonte autoritativa dos dados.

## Cuidados
Não apagar dados D1, R2, equipes, OPs, chaves ou fotos durante a limpeza visual. Não limpar armazenamento local indiscriminadamente: pode conter credenciais e pendências offline.
