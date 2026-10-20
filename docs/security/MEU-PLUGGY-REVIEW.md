# Meu Pluggy — pesquisa pública e decisão

Revisão 0.4, 16/10/2026. Escopo: pesquisa pública passiva, sem login, scan de infraestrutura, execução de exploits ou consulta a dados bancários. Decisão: seguir com Meu Pluggy como integração automática prioritária no planejamento e, após autorização de implementação, em ambiente sintético. Não é aprovação de produção nem auditoria do fornecedor.

## Resultado e limites

Nas fontes consultadas não foi encontrada evidência pública comprovada de vulnerabilidade grave vigente ou vazamento do próprio serviço Meu Pluggy. Isso descreve a pesquisa, não prova inexistência de falhas, incidentes privados ou risco futuro. O repositório público não contém todo o código de produção. Não foram inspecionados infraestrutura interna, pentest privado, controles operacionais ou dependências de um app Orbe inexistente.

A investigação incluiu documentação do fornecedor, repositório/issues públicos e advisories de segurança relacionados a Pluggy. Homônimos como a biblioteca Python pluggy não foram atribuídos à empresa financeira. Relatos, declarações comerciais e vulnerabilidades confirmadas são diferenciados abaixo.

| Achado | Evidência e alcance | Efeito no Orbe |
|---|---|---|
| Crítica: CVE-2026-27584 | Advisory oficial do Actual Budget: seu sync-server até 26.2.0 permitia consultar saldos/transações sem autenticação nas integrações Pluggy/SimpleFIN. Corrigido em 26.2.1. Falha do integrador, não prova de invasão da Pluggy | Não adotar esse servidor. Testar autenticação e propriedade em todas as rotas da nossa ponte, inclusive status |
| Moderada: CVE-2026-46700 | Advisory do Actual Budget: usuário autenticado sem privilégio adequado podia inferir existência de secrets, sem ler seus valores; até 26.5.2, corrigido em 26.6.0 | Autenticação não substitui autorização; testar também metadados/configuração |
| Cobertura: cofrinhos MP | Issue #22 no repositório Meu Pluggy, aberta em 26/06/2026 e apresentada como aberta na consulta, relata saldo da conta sem cofrinhos | Relato funcional, não vulnerabilidade. Não prometer cobertura completa sem homologação |
| Disponibilidade Bradesco | Página de status consultada apresentava incidentes de indisponibilidade/transações não retornadas | Estado parcial/desatualizado, data da última atualização e preservação do último lote válido |
| Armazenamento pelo fornecedor | README descreve backup dos dados; política pública descreve tratamento/compartilhamentos e segurança declarada | Serviço não é local nem de conhecimento zero. Revogar conexão não equivale a comprovar exclusão de todos os backups |

## Fontes primárias

- [Advisory crítico Actual Budget](https://github.com/actualbudget/actual/security/advisories/GHSA-m2cq-xjgm-f668).
- [Advisory moderado Actual Budget](https://github.com/actualbudget/actual/security/advisories/GHSA-3f62-qv96-4p78).
- [Meu Pluggy: repositório e descrição do armazenamento](https://github.com/pluggyai/meu-pluggy).
- [Relato de cofrinhos Mercado Pago](https://github.com/pluggyai/meu-pluggy/issues/22).
- [Status operacional Pluggy](https://status.pluggy.ai/).
- [Termos e política de privacidade](https://www.pluggy.ai/legal).
- [Guia oficial de uso pessoal](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use).
- [Guia da API pessoal](https://meu.pluggy.ai/api-guide).
- [Autenticação Connect](https://docs.pluggy.ai/en/docs/connect-widget/authentication).

A visão pública de Security do Meu Pluggy não apresentou advisory publicado, mas houve erros de carregamento em páginas de segurança; não é evidência suficiente de inexistência de registros. A pesquisa não substitui monitoramento futuro. Declarações de criptografia do fornecedor não foram verificadas por auditoria independente nesta etapa.

## Condições para avançar

1. Segredos Pluggy somente no servidor; nenhum segredo em EXPO_PUBLIC, bundle, URL, logs ou Git. Backend autentica o proprietário e limita item/account IDs aos vínculos desse proprietário.
2. Navegação bancária e consentimento no canal oficial do fornecedor/banco, sem coletar senha bancária no Orbe, scraping ou automação de internet banking. Confirmar o tipo real de conector e seus dados solicitados antes de habilitá-lo; não supor que todo conector seja Open Finance regulado.
3. Sem IA/MCP/BI/analytics ou integrações adicionais autorizadas. Fornecedor e ponte necessariamente processam o conteúdo da sincronização; não alegar criptografia ponta a ponta contra esses destinatários.
4. Testes sintéticos de autenticação, autorização, expiração, revogação, logs, exclusão, dependências e falhas antes do gate de dados reais já previsto. Revisar advisories novamente com versões/lockfile definidos.
5. Confirmar privadamente cobertura por banco/produto e consentimento do titular antes de qualquer conexão real. Cofrinhos ausentes ficam explicitamente indisponíveis; produto ausente fica explicitamente indisponível.

Na pesquisa original não havia backend; em20/10/2026 há backend próprio somente Auth/metadados. Nenhum banco conectado ou SDK financeiro instalado; processamento financeiro permanece bloqueado. A preferência do usuário pelo fornecedor não elimina o gate de dados reais nem autoriza contratação.
