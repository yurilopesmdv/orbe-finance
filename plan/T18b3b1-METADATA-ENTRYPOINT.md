# T18b3b1 — entrypoint separado, sem deploy

20/10/2026. MPG-12a, ADR-012. Integrador único; depende T18b3a.

Paths: novo orbe-metadata/index.mjs e teste host, script bridge-deploy.py/testes, package.json, spec/plano/checkpoints.

Compor factory existente com Deno.env.get e fetch do host. Nenhuma flag financeira, fornecedor, lease ou chave privilegiada. Config ausente deve consultar somente flag e retornar503/no-store; config válida sem Bearer deve retornar401 sem rede. Testar startup inválido sem erro bruto e runtime separado sem mudar endpoint off anterior.

Allowlist do helper passa a enumerar sete fontes e verificar ambos entrypoints exatos, antes de qualquer deploy. Fixture de teste deve produzir conteúdo correto por nome; adulteração do novo entrypoint deve ser recusada. Config TOML/deploy ativo ficam fora da fatia.

Aceite: typechecks/testes completos; nenhuma publicação/remoto ou teste físico nesta etapa. Próxima T18b3b2: pesquisa oficial de runtime/configuração, helper e manifest separados antes de qualquer ativação.
