# SPEC-009 — Integração automática Meu Pluggy

Estado: draft, revisão 0.4 de 16/10/2026. O usuário escolheu Meu Pluggy, condicionado à pesquisa pública de segurança. [Resultado da pesquisa](../../docs/security/MEU-PLUGGY-REVIEW.md): seguir no planejamento; produção depende de evidências próprias. Esta spec prevalece sobre a opção local sem agregador da revisão 0.3. A origem financeira é exclusivamente Open Finance.

| ID | Requisito |
|---|---|
| MPG-01 | DEVE usar exclusivamente Open Finance na conexão original do banco via Meu Pluggy, sem fallback por senha bancária, e priorizar sincronização automática Meu Pluggy para Bradesco e Mercado Pago PF; confirmar termos/cotas gratuitos pessoais antes de implementar, sem prometer gratuidade permanente ou de infraestrutura |
| MPG-02 | DEVE manter credenciais privilegiadas exclusivamente na ponte autenticada, sem incluir segredo no cliente; toda leitura/status/sincronização valida proprietário e vínculo do item/conta no servidor |
| MPG-03 | DEVE distinguir sessão da ponte e desbloqueio local; Face ID/desbloqueio do iPhone não substituem autorização HTTP, nem clientUserId enviado pelo cliente comprova propriedade |
| MPG-04 | DEVE respeitar as capacidades do proxy pessoal, manter lista autorizada de itens e mostrar data/parcialidade; não simular tempo real nem chamar refresh/listagem não disponíveis no plano |
| MPG-05 | DEVE homologar separadamente saldo, movimentos, investimentos e cofrinhos de cada banco; ausência não vira zero nem promessa de cobertura, com prevenção de dupla contagem |
| MPG-06 | DEVE bloquear dados reais até validar acesso, segredos, rede/logs, dependências e revogação/exclusão; pesquisa pública e criptografia declarada não certificam risco zero |
| MPG-07 | DEVE restringir destinatários ao banco, Pluggy e ponte aprovados para a sincronização, além do aparelho; nenhum envio financeiro a ferramentas de desenvolvimento, IA, analytics ou relatório externo |
| MPG-08 | DEVE preservar o último lote válido diante de indisponibilidade e distinguir revogação bancária, desvínculo no Orbe, apagamento local e solicitação de exclusão no fornecedor |

## Aceite futuro

- Sem sessão, com sessão expirada, identidade indevida ou item/conta sem vínculo, nenhuma rota financeira ou de status revela dados ou metadados privados; testar antes de consultar fornecedor.
- App distribuído, logs e erros sintéticos não contêm segredos; requisição alterada pelo cliente não amplia autorização.
- Fixtures de proxy sem listagem global/refresh, atualização diária, erro parcial e ausência de produto mantêm interface honesta e idempotência.
- Cofrinho MP não retornado e movimentos Bradesco indisponíveis aparecem como parcialidade datada, sem apagar valores válidos anteriores nem inventar zeros.
- Revogar impede nova coleta e evento atrasado não recria conexão apagada. Exclusão de backup do fornecedor só é afirmada com confirmação de alcance/retencão.

Senha/sessão continuam no escopo. Expo Go permanece ambiente sintético enquanto limitações de biometria/armazenamento do runtime real não forem resolvidas. Implementação sintética autorizada, uma task por vez; consentimento bancário permanece após gate.

## Contrato de arquitetura T74

A ponte é de leitura sob sessão e não persiste saldos, movimentos, posições ou relatórios. Atualização automática bancária ocorre no fornecedor mesmo com app fechado; o Orbe recebe e promove novos lotes ao abrir/retomar desbloqueado ou solicitar busca. Não prometer sincronização do cache local com o app fechado. Credenciais, vínculos e limites ficam no servidor, relatórios/categorias/metas no aparelho. [Contrato T74](../../plan/T74-BRIDGE-CONTRACT.md).
