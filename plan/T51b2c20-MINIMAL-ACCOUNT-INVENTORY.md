# T51b2c20 — Inventário mínimo de contas no servidor

MPG-35. Integrador único. Depende decoderMPG-27 e vínculo pendingMPG-33. Paths: account-inventory.ts, tests/bridge/account-inventory.test.mjs, package.json, spec009/TASKS/STATE. Sem rede real/SQL/deploy.

1. Projetar IDs e moeda de página completa, descartando PII e valores sem acessá-los.
2. Aceitar BANK/CREDIT e manter kindunknown; crédito precisa de binding técnico para a projeção existente, mas não produz saldo/limite nesta fatia.
3. Validar UUID/item/proveniência numérica/duplicatas/limites e defaultoff; testar campos privados com getters que lançam erro.
4. Checks completos/scan/Git. Próxima etapa RPC de registro dos bindings mínimos, owner fixado/connectionpending/revision/atomicidade e sem ativação; iniciar por spec/plano e testesSQL.

Aceite: não existe chamada financeira neste módulo, saída não contém valores nem números de conta/titular. Fixture valida comportamento, não homologa fornecedor/banco.
