# Acesso às contas

20/10/2026. Acesso/login lembrado e proteção de captura/multitarefa confirmados pelo titular. Tela Minhas contas preparada, valores ocultos por padrão, contas correntes/pagamento separadas dos demais produtos. Nenhum banco foi conectado por esta implementação.

## Implementado e validado sem dados reais

Status autenticado → registry de IDs internos sob RLS → lote acquire → Auth/owner/vínculo/revisão/lease → autenticação técnica privada → leitura limitada e decoder decimal exato → DTO sem PII → Auth/lease novamente → finalize → cache volátil. Perda de sessão/proteção/atividade cancela e purga memória; token salvo no Keychain é exclusivamente de acesso Orbe, não financeiro. Não há senha bancária no app nem valores persistidos. Fonte/data/relação desconhecidas permanecem desconhecidas, cobertura parcial não vira patrimônio total.

Gates separados no cliente: accountReadsEnabled, liveIntegrationEnabled, privateFinancialDataApproved, todosfalse. Factoryoff não instancia readers/gateway/cache/UUID nem rede. Backend orbe-bridge v4 publicado com liveApprovedfalse. Código tem modos fixture/live explícitos e trava de código+flags; não habilitar um flag sozinho como atalho. ExpoCrypto57.0.4 só gera namespaceUUIDlocal depois dos guards; não introduz persistência/criptografia financeira. [SDK57 incluídoGo](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/), conferido20/10.

## Próximas etapas e ativação conjunta

Antes de uso real: runtime Edge/context.source, composição/deploy próprios, configuração privada do fornecedor, vínculo administrativo de itens/contas com titularidade e OpenFinance original comprovados por banco, revisão de retenção/logs/subprocessadores e gates de runtime/dependências. Não considerar nome MeuPluggy/isOpenFinancefalse do proxy como prova sobre a origem bancária. Não coletar CPF/senha/extrato para comprovar por conveniência.

O titular fará em seu navegador a autorização bancária original no Meu Pluggy e o proxy MeuPluggy na aplicação demo, sem enviar credenciais/IDs pelo chat. A configuração backend será preparada antes dessa etapa, com segredo fora do Metro. Não contratar, consentir, gerar webhook/cron, conectar bancos ou consultar conteúdo real pelas ferramentas. A publicação da tela desativada não é homologação de banco.

810 testes/typechecks/export iOS2.7MB aprovados nesta composição; inspeção privada1201 fontes/56 instâncias sem as duas raízes de advisories no JS. Audit ainda19 pacotes afetados na toolchain, mesma exceção exclusivamente sintética até23/10/2026; ausência no JS não é auditoria do Expo Go nativo/EAS/fornecedor. Nenhuma promessa de risco zero/E2EE. Testes físicos restantes e ativação são reunidos ao final, conforme pedido do titular.

T51b2c9 concluída: consulta atual de item/consentExpiresAt antes de contas, e expiração revalidada após a leitura. Statusantigo/arrayvazio não ultrapassam consentimento vencido.817 testes/typechecks, nenhuma chamada a conta real. A inspeção anterior de fonte1201/56 refere-se ao cliente c8, não ao servidor/fornecedor.

T51b2c11: decimal exato comprovado no Edge real com números inventados e função temporária removida;827 testes/typechecks. Ponte remota confirmada v3, recibo antigo reconciliado por hashes de source iguais aos registrados, sem deploy. Smokes financeirooff3/statusnegativo5 aprovados.

Atualização c31:934testes/typechecks, rootunificado publicado v4 com trava financeira false,7smokes503/no-store. Fonte de descoberta/autenticação/lease/commit pronta e testada com rede fictícia, sem chamada real ao fornecedor.12migrations aplicadas; um vínculo técnicoMPpending, nenhuma conta real registrada. Perfil técnico local preenchido; ID fornecido guardado privadamente, sem pedir nova cópia.
