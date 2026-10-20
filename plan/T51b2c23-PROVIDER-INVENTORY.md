# T51b2c23 — Descoberta mínima no pipeline do provedor

MPG-38. Integrador único. Depende MPG-25/35/37. Paths: pluggy-auth.ts, tests/bridge/pluggy-inventory.test.mjs, package.json/spec/TASKS/STATE. Sem segredos reais, rede ou deploy.

1. Extrair método interno de coleta reutilizável para duas projeções, preservando API das factoriesexistentes.
2. Expor factory exclusiva de inventário mínimo, sem acesso público à chave/contexto financeiro.
3. Testar Auth→itemconsent→contas com resposta inventada contendoPII/saldos; verificar saída mínima/expiração/abort/close/off e regressões.
4. Checks e checkpoint. Próxima c24 coordenador resolve→descoberta→revalidar→store sem registro após cancelamento/expiração/conflito.
