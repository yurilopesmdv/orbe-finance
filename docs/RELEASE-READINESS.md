# Prontidão do Orbe — 20/10/2026

**Prévia publicada; contas bancárias reais ainda desativadas.** Este documento descreve o estado atual. Evidências anteriores permanecem em [TASKS](../tasks/TASKS.md); o roteiro de uso vigente está em [ativação](ACCOUNT-ACTIVATION.md).

| Entrega | Evidência atual | Limite |
|---|---|---|
| Acesso pessoal | Conta criada; sessão lembrada por refresh token rotativo no Keychain; proprietário fixo e revalidação online | Senha não é salva; terceiros, Face ID e recuperação por e-mail desativados |
| Proteção | Titular confirmou retomada sem senha, captura e multitarefa; consultas privadas aguardam proteção pronta/ativa | Não comprova cold restart, logout, gravação, VoiceOver, cache ou outras versões |
| Interface | Gastos, carteira, metas, relatórios e classificação demonstrativos; conexões autenticadas de metadados | Valores demonstrativos não são dados bancários; identidade visual adiada |
| Infraestrutura própria | 13 migrations imutáveis aplicadas, RLS/sessões/leases e rollback de fixtures; bridge v6 e metadata v4 ACTIVE | Banco contém metadados, nenhum saldo/movimento/posição financeira |
| Credenciais | Client ID/Secret autenticados uma vez somente em POST/auth; segredos somente no backend, quatro flags financeiras false | Chave temporária não foi guardada/exibida; nenhuma leitura financeira foi feita |
| Vínculos | Um item Mercado Pago cadastrado como pending, sem contas/capacidades/aprovação OF | Bradesco confirmado no portal pessoal, item na aplicação ainda não identificado |
| Cadeia de contas | Leitura e descoberta preparadas com autorização, consentimento atual, lease global, centavos exatos e cancelamento | Testes com rede/dados fictícios; entrypoint liveApproved false e flags cliente/backend false |
| Transporte iOS | Cabeçalhos no-store/no-cache/Pragma, cookies omitidos, redirects recusados e prontidão antes da consulta | Revisão da fonte instalada não certifica o binário Expo Go; [relatório](security/EXPO-FETCH-REVIEW-20261020.md) |

## Verificação atual

1060 testes/typechecks aprovados (938 Node +122 Python), incluindo publicador, identidade interna e projeção backend de movimentos com dados fictícios. A prévia c38 foi publicada com 967 testes; mudanças posteriores são administrativas/backend isolado, sem nova ativação ou atualização do cliente. Exportação iOS e auditoria privada do grafo JavaScript: 1205 fontes/56 instâncias, sem braces/node-forge no cliente. Todos os perfis privados comparados com fonte/exportação antes do upload; mapas fora do Git/Metro e sem publicação. CI, update, manifesto e QR atuais em [EXPO-PREVIEW](EXPO-PREVIEW.md).

No backend, sete rotas financeiras desativadas retornaram 503/no-store; cinco casos negativos de autenticação/metadados passaram. Configuração confirmada por digests; fonte de 23 arquivos bridge e cinco metadata corresponde aos recibos privados. Não foi feito teste remoto positivo com a sessão do titular, nem leitura de suas contas por ferramentas.

## O que falta para o primeiro saldo real

| Ordem | Pendência | Responsável e saída necessária |
|---|---|---|
| 1 | Origem Open Finance e condições do fornecedor | Evidência específica de origem por banco, subprocessadores, logs, retenção/exclusão e ausência de saídas automáticas não aprovadas. Documentação pública genérica não basta; questões registradas, nenhum contato enviado |
| 2 | Dependências e runtime | Resolver ou mitigar formalmente duas raízes altas no tooling; validar controles nativos sem dados reais. Exceção atual só permite dados sintéticos até 23/10/2026, sem extensão implícita |
| 3 | Liberação técnica controlada | Após os gates anteriores, mudança explícita/versionada do codegate e das flags, descoberta no backend e aprovação da conexão. Não editar verifiedAt/capacidades manualmente para simular evidência |
| 4 | Homologação no aparelho | Conferência privada de saldo/moeda/data/parcialidade, uma conexão por vez, e roteiro final de sessão/proteção. Valores não entram em IA/MCP/logs/screenshots/documentos |

Transações, investimentos e cofrinhos reais são fatias posteriores com adaptadores/paginação/cobertura próprios; modelos e relatórios sintéticos não significam integração entregue. Nenhum serviço pago ou build próprio é exigido automaticamente: Expo Go e orçamento zero continuam a direção vigente. Não há garantia de risco zero nem aprovação de todo o runtime/fornecedor pela quantidade de testes.

Atualização21/10: T22c1–c4 prepararam identidade opaca, janelas UTC/Brasília e projeção mínimaBANK de movimentações. Não há transporte bancário de movimentos ligado ao runtime; investimentos/cofrinhos reais continuam posteriores. O primeiro saldo continua condicionado aos gates descritos acima, não à conclusão desses módulos isolados.

Publicação21/10/T22c5: bridgev6 com código financeirooff e fontes compartilhadas atuais; CI39587278861 success,7smokes503/no-store e5negativosmetadata aprovados. Metadata4 preserva o snapshot anterior e o mesmo protocolo/default128KiB; não foi redeployado. Nenhuma leitura real, flag, chave ou QR novo.

T22c6/c7: cursor cifrado de sessão/lote e manifesto BANK validado em módulos isolados, sem chave real ou nova rota. Relatórios completos e próxima tarefa estão no [checkpoint](../roadmap/STATE.md).

T22c8/c9: transporte privado de movimentações preparado e validado com rede fictícia até o ledger, incluindo múltiplas contas/janelas e500registros. Ainda falta endpoint/coordenador de progresso e cliente; nenhuma consulta bancária real foi habilitada.

T22c10: migration13 de hashes/nonces/contagens de páginas aplicada apósCI39596337560success; fixtures SQL instaladas com rollback e owner preservado. Nenhum cursor bruto/query/valor financeiro é persistido; controle ainda não foi ligado a endpoint ativo.
