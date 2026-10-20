# T18b3a — composição local do runtime de metadados

20/10/2026. Requisito MPG-12; ADR-012. Responsável: integrador único. Dependências T18b1/T51d concluídas.

1. Factory Web standard captura leitor de configuração de boot injetado; somente habilitação literaltrue.
2. Compor createSupabasePorts e createBridgeHandler existentes com transporte injetado obrigatório; nenhum Deno/env global, serviço privilegiado ou dependência nova.
3. Desligado/configuração inválida usa handler desligado, inclusive se leitor lança. Não fazer fallback para fetch global.
4. Testar zero acesso quando desligado, flag inválida, config inválida, captura imutável, ausência de Bearer, owner positivo sintético, sessão negada e rota financeira negada.
5. Atualizar allowlist explícita do deploy desligado para nova fonte compartilhada, preservando entrypoint literalfalse e demais guardas.

Paths: specs009, ADR, este plano, _shared/metadata-runtime.ts, tests/bridge/metadata-runtime.test.mjs, package.json, scripts/bridge-deploy.py, checkpoints. Aceite: check completo; nenhuma chamada remota ou publicação nesta fatia. Testes são host Node, não prova de Deno/HTTP real.

Próxima T18b3b: revisar fonte de configuração/empacotamento/manifest e runtime gerenciado separado antes de ativação.
