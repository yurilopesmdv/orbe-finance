# T51b2b2 — conta de provedor para DTO mínimo

20/10/2026; MPG-15/SEC-01/07/15/PORT-04; integrador único, depende decoder MPG-14 e DTO T21a. Paths _shared/pluggy-accounts.ts, testes provider→DTO→normalizer/cache, allowlist e docs. Sem rede/deploy/segredo/cliente novo.

Função gatedfixtureOnly recebe contexto autorizado projetado (item/conexão/bindings/datas/relações/cobertura), captura escalares e projeta BANK em DTO interno existente. Conferir id/item/relação/mapa; CREDIT excluído com cobertura parcial. Descarta todos os campos de identidade/URLs; desconhecidos monetários/datas ficam null/partial. Centavos por BigInt do literal exato, exponentes±32, sem fração de centavo e sem overflow safeinteger. Moedas BRL/USD/EUR; não homologada null sem coerção. Relação/data vêm de evidência externa ao mapper, não inferência do JSON.

Aceite: gateszeroinput, conversão exata/lossydenied/null/negative/overflow, escopo/vínculo/duplicata/limite/paginação, exclusão de crédito/limites/PII, fonte/desconhecidos/unknown/emptyfalse. Integração com normalizeAccountPage e MemoryAssets confirma DTO mínimo e lote inválido não substitui versão anterior. Contadores decodificados exatos. Typechecks/suíte/commit/push/CI; sem republicarapp/backendoff. Ownership/consentimento/lease e criação de vínculos continuam tarefas separadas; não usar CPF como prova por conveniência.

Concluída:735 testes/typechecks,12 casos novos cobrindo o aceite. Campos obrigatórios próprios e erros sanitizados; saída imutável sem identidade externa. Sem publicação por módulo de backend inativo. Próxima composição precisa comprovar owner/sessão/lease separadamente; o mapper não oferece essa autorização.
