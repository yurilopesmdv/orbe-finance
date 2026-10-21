# Prontidão do Orbe — 21/10/2026

Login, sessão lembrada e proteções estão publicados. Contas, movimentações e investimentos têm cadeias completas implementadas com dados sintéticos. **Leitura de bancos reais permanece desativada.** Não confundir implementação validada com homologação das contas pessoais.

| Entrega | Estado e limite |
|---|---|
| Login pessoal | Conta criada, refresh token rotativo em Keychain; senha não é salva. Cadastro de terceiros/FaceID/recuperação desativados |
| Proteção | Retomada, captura e multitarefa confirmadas pelo titular. Cold restart/logout/gravação/VoiceOver ficam no teste final |
| Contas | Descoberta, bindings técnicos, lease, autorização, centavos exatos, transporte/cache/tela preparados |
| Movimentações | Paginação mensal, identidade opaca, progressoSQL/finalização, HTTP, transporte/cache/tela; fluxo500registros validado |
| Investimentos | Até1000posições/10páginas, bruto/líquido/data exatos, registroRLS pósstage, commit/finish antes de cache. Fluxo integrado1000posições validado; [guia](INVESTMENT-ACCESS.md) |
| Cofrinhos | Modelos locais existentes; fonte bancária precisa comprovar natureza e vínculo. Tela informa limitação; nenhum saldo duplicado ou zero inventado |
| Infraestrutura | 17 migrations imutáveis aplicadas, hashes verificados. FixtureSQL instalada passou com rollback/zeroresíduos/ownerpreservado. Só metadados, sem valores financeiros |
| Vínculos reais | Um itemMPpending, sem capacidades/aprovaçãoOF. Bradesco consta no portal pessoal, item da aplicação ainda não identificado |
| Provedor | Credenciais e metadados técnicos do proxyMP conferidos; consentimento devolve associação de item divergente, recusada para ativação. ZeroGETfinanceiro por ferramentas; APIkeys não persistidas |

## Validação desta entrega

1206 verificações aprovadas naCI T75a (1069 Node +137 Python); seis testes adicionais do diagnóstico técnico aprovados localmente, incluindo tipos cliente/backend. Logs locais `/tmp/orbe-check-investment-client.log`. Testes integrados verificam fins recusados, registroRLS ausente, sessão bloqueada e gatesoff semrede; o provider é fictício. FixtureSQL real valida claim/commit/finish e replay, sem dados pessoais.

SDK57.0.31/Router57.0.29 preservados. ExportiOS e auditoria do grafo atual1216fontes/56instâncias aprovados; resultado e IDs finais em [EXPO-PREVIEW](EXPO-PREVIEW.md). Scans com todos os perfis privados antes de subir artefatos. Sourcemaps ficam privados. A CI do backend consolidado39641198955 passou; cliente tem checkpoint próprio.

Backendv8 publicado continua financeiramente desligado por `liveApproved:false`, independente das envs. Chaves de movimentos e flags de movimentos/investimentos provisionadas, com os11digests conferidos e todas as seisflags financeirasfalse; metadata5 preserva suas fontes. Código local mais novo não equivale ao snapshot remoto; versões publicadas constam em STATE/EXPO-PREVIEW.

## Pendências para dados reais

1. Titular confirmouOpenFinance nas duas origens; falta resolver a associação divergente entre proxy e consentimento devolvido pelaAPI e identificar o item espelhado do Bradesco. Concluir comprovação programática da origem por banco e concluir avaliação do fornecedor (retenção/logs/subprocessadores/exclusão). Proxy MeuPluggy e tabelas públicas não comprovam o consentimento original. Nenhum contato externo enviado.
2. Resolver/mitigar as duas raízes de advisories altos no tooling e validar controles nativos. Exceção existente permite somente dados sintéticos até23/10/2026; não foi estendida. Revisão de fontes não certifica todo binário ExpoGo.
3. Chaves já preparadas. Falta a liberação técnica versionada após os gates. Descoberta não pode fabricar capacidade ou `verifiedAt`.
4. Homologação privada no iPhone, uma conexão por vez, e testes físicos restantes agrupados ao final. Dados financeiros não devem entrar em IA/MCP/logs/screenshots/documentos.

ExpoGo e orçamentozero mantidos. A quantidade de testes não garante riscozero nem justifica ativação por atalho. Relatórios/gastos/carteira demonstrativos continuam separados dos dados reais.
