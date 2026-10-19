# T51c — Limites da resposta e destino Auth

Estado: done (testes locais; aparelho pendente). AUTH-10, SEC-05/07/08/12/17. Integrador único; ajuste identificado durante revisão T36a, que continua próxima.

## Evidência / decisão

Gateway atual usa response.json sem cap e referencia config.origin/publishableKey depois da validação, permitindo mutação do objeto passado. Não há evidência de vazamento; corrigir fronteiras antes do uso ampliado. Capturar primitivos próprios uma vez e validar typeof antes de regex, impedir Stringobj/coerção e não herdar configuração.

SDK instalado expo57.0.30 tem expo/src/winter/fetch/FetchResponse.ts com ReadableStream, fetch.ts encaminha signal/redirect/credentials. iOS/Fetch/NativeResponse.swift recusa redirecionamento com modoerror e ExpoURLSessionTask.swift desliga httpShouldHandleCookies quando omit. Evidência de source local fixado no lock, não teste físico. RN fetch global não deve ser presumido stream-compatible. Provider deve injetar expo/fetch, sem trocar fetchglobal ou adicionar pacote. RequestInit.cache não consta dos campos nativos suportados; manter Cache-Control no-store e não declarar inspeção de cache nativo realizada.

Criar src/lib/bounded-json.ts (não importar backend no cliente), response metadata/body mínimos, Content-Typeapplication/json, Content-Length se presente inteiro≤131072, bytes efetivos≤131072, UTF8fatal e JSON. Ler stream sem fallback text/json ilimitado; abort cancela reader e interrompe await mesmo se cancel for ignorado. Timer total20s existente engloba leitura, finally limpa listeners/reader; sem logs/erro bruto. Gateway sanitiza falha no mesmo AuthFailure unavailable/cancelled. 204 não requer corpo.

## Paths / aceite

spec001, este plano, src/lib/bounded-json.ts, src/features/auth/gateway.ts/provider.tsx, tests/auth/gateway.test.mjs, tests/security/bounded-json.test.mjs, package.json, docs/security/BRIDGE-CORE.md, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md.

Testar config mutada/objeto com coerção/inherited sem egress, resposta grande/chunked/Content-Length enganoso/missingstream/mime/UTF8 inválido, abort durante body/transporte ignorando cancel/deadline; login/recovery antigos continuam. Typechecks+suite e export iOS necessários por mudança no Provider real. Scan PAT/ownerUUID no dist sem imprimir valores. Sem login real/consentimento/email/metadata financeira.

## Evidência

506 testes/typechecks aprovados (13 novos), export Hermes iOS2.5MB aprovado. PAT/ownerUUID ausentes do dist. Config primitiva capturada, bytes efetivos/MIME/UTF8/cancel/deadline e descarte de body não-success sem leitura validados. Provider injeta expo/fetch sem nova dependência; fonte instalada iOS revisada, sem alegar teste nativo/controle de cache realizado. Nenhuma senha/login positivo/email/finança real nas ferramentas.
