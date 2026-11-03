# DF EXTRUSOR PRO — Migração para API privada

Esta branch prepara a migração das fórmulas do navegador para uma API privada.

## Situação atual

O site público antigo contém fórmulas e credenciais dentro do JavaScript entregue ao navegador. Mesmo removendo os arquivos da branch atual, commits antigos de um repositório público continuam podendo ser consultados pelo histórico.

## Migração segura

1. Publicar `df-extrusor-worker-privado.js` como Cloudflare Worker.
2. Configurar no Worker, como Secrets, `LA_SECRET` e `SESSION_SECRET`.
3. Configurar `LA_NAME`, `LA_OWNERID`, `LA_VERSION` e `ALLOWED_ORIGIN`.
4. Colocar a URL do Worker em `secure-frontend/api-config.js`.
5. Publicar somente `secure-frontend/` em um frontend limpo, sem fórmulas.
6. Após validar tudo, trocar/rotacionar o segredo do LicenseAuth.
7. Para remover o acesso ao histórico antigo, privatizar/apagar o repositório antigo ou migrar o frontend limpo para um novo repositório público sem o histórico anterior.

**Nunca publicar o código do Worker no repositório público.**
