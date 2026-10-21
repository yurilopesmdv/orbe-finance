# T23c — Adapter seguro de investimentos e reservas

PORT-11/SEC-006; dependeT22c26 eT23a/b1/b2. Integrador único; gates financeiros continuamoff. Evidência: docs/research/INVESTMENT-ADAPTER-EVIDENCE-20261021.md.

| Microtask | Depende | Paths/foco | Aceite |
|---|---|---|---|
| c0 | pesquisa | spec004/research/esteplano/TASKS/STATE | fontes primárias, OF≠direto, reservas não inferidas |
| c1 | c0 | _shared/pluggy-investments.ts +testbridge/allowlist | projeçãopura/snapshotúnico até1000/IDs internos/centavosexatos/null/unknown/semextras |
| c2 | c1 | targets/network +testbridge | item/page fixos/budget/SSRF/capacidade, sem novasrotas gerais |
| c3 | c1 | nova migration/fixtures/admin para positionsbindings | metadata owner/RLS, IDs internos, nenhumvalor/nome/autoaprovaçãoOF |
| c4 | c2,c3 | providerport econtexto autorizado | Authprivado/consentimento/revisão/sessão/abort/decoder/bindings |
| c5 | c4 | progresso/finalizaçãoSQL+REST | lease/contadores/sessão/rollback e semdadosfinanceiros |
| c6 | c5 | HTTP/runtimebackend/gates | mínimoDTO/revalidação/finalização/entrypointoff |
| c7 | c6 | transporte/stager/cachecliente | registry/progresso/memória/guard/falhas |
| c8 | c7 | telaprivadaposições/reconciliação | bruto/líquido/data/null/unknown/semduplicarsaldos |
| c9 | c8 | reservas explícitas/localallocations | sóevidênciadepai/natureza, nãoduplicarativo, semtransferência |
| c10 | c8,c9 | fluxoHTTPfake/export/audit/CI/docs | integração sintética≠homologaçãoreal; checkpointpublicáveloff |

Cada etapa gera plano limitado antes de código e checkpoint. c1 não fazHTTP, provisionaIDs ou suporta múltiplaspáginas: recusa snapshotfragmentado; transporte posterior não pode anunciar completude usandoessa limitação. Dados do titular ficamfora de testes/ferramentas/Git. Nada pago ou contatoexterno.

## Entrega consolidada de transporte — 21/10

Por orientação do titular, c4d/c4e serão implementadas e validadas juntas: collector paginado e port privado de investimentos. Responsável: integrador. Paths: investment-read.ts, pluggy-auth.ts, allowlist e teste integrado do port. Aceite: até10páginas/1000posições, contadores estáveis, sem duplicatas, centavos exatos, staging só após validação integral, sessão/lease/consent vigentes, cancelamento/deadline e nenhuma credencial/ID externo no resultado. Etapas c5–c10 permanecem sequenciais, sem aprovação intermediária.

## Integração do backend (c5/c6)

Paths: migration17, fixture position-bindings, investment-progress-rest/handler/finalize/runtime, configuração e roteamento; integrador único. Progresso metadataonly por sessão/lease, claimúnico/commit≤1000/finishdedicado. ValidaçãoSQL com rollback antes de aplicar; HTTP exige reAuth/resolver atual antes de commit. Stage só IDs após snapshot integral, resolução posterior sem troca de vínculos existentes. Aceite integrado providerfake→HTTP→DTO mínimo e falhas de sessão/commit; entrypoint continua off. Sem acesso financeiro por ferramentas.
