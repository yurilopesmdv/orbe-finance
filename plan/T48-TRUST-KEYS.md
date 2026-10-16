# T48 — Fronteiras de confiança e chaves

Estado: done como decisão de arquitetura sintética, 16/10/2026. SEC-06/08. T47 concluiu com bloqueio real, preservado. Nenhuma chave gerada ou instalada.

| Fronteira | Quem pode ler | Chaves/controle proposto |
|---|---|---|
| Banco → Pluggy | Banco/Pluggy, conforme consentimento | Canal oficial; sem senha bancária no Orbe; comprovar Open Finance |
| Pluggy → ponte | Pluggy, runtime/hospedagem da ponte e operadores autorizados | TLS; segredo Pluggy somente no servidor; resposta em memória por requisição |
| Metadados Supabase | Proprietário autenticado no escopo e operadores privilegiados | RLS de vínculo, Auth server-side, secret store; repouso gerenciado não é conhecimento zero |
| Ponte → app | Sessão do proprietário e runtime do aparelho | TLS, Cache-Control no-store e autorização por vínculo |
| Persistência real no iPhone | App desbloqueado e riscos do SO/operador | SQLCipher + chave protegida no Keychain candidatos; T65/T67 devem validar antes de real |
| Expo Go sintético | Runtime/debugger podem inspecionar | Somente memória e fixtures; nenhuma chave de produção |

Alternativa gerenciada com persistência financeira descartada por T74: aumenta cópias/retenção. Alternativa de segredo privilegiado embutido no app rejeitada: bundle não é cofre. Escolha é ponte de leitura e persistência/cálculos no aparelho. Isso não impede Pluggy/hospedagem de ler durante processamento e não é E2EE.

Sem criptografia caseira. Não simular proteção por senha usando hash fixo, AsyncStorage ou modal visual. Futuro ciclo de chaves precisa definir geração, vínculo à instalação, reset, backup e perda; segredo local não é senha do backend. Se armazenamento nativo protegido não estiver disponível, manter real bloqueado. Não há promessa de apagar toda memória JS ou backups de terceiros instantaneamente.

Matriz revisada contra T74 e modelo de ameaças: plaintext, responsáveis, chaves e limitações explícitos. Não executados criptografia, hardware ou restauração; tasks próprias futuras. Próxima T49: runtime e superfícies de desenvolvimento.
