# T51b2c19 — Rede restrita da cadeia de contas

MPG-34. Integrador único. Depende bootMPG-26, destinosMPG-16/25. Paths: account-network.ts, tests/bridge/account-network.test.mjs, package.json, spec009/TASKS/STATE. Não modificar entrypoints ou remover fixtureOnly.

1. Definir lista fechada de destinos/métodos/credenciais; flags independentes e off sem tocar argumentos.
2. Encaminhar fetch só após validação, com cookies/cache/redirect/referrer fechados; erro genérico sem conteúdo.
3. Testar host/query/headers/body/abort/redirecionamento e conexão com portaAuthcontas usando rede injetada.
4. Check completo, scan e checkpointGit. Sem requests reais de fornecedor ou novo QR, pois módulo backend ainda não importado por entrypoint.

Aceite: não permite vazamento cruzado de credenciais entre provedores por destinos/headers suportados. Não é certificado de privacidade do fornecedor; não aprova produção nem prova segurança de logs externos.
