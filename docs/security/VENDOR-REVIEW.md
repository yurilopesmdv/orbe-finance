# Revisão de fontes e fornecedores — 16/10/2026

**Revisão vigente 0.4:** [SPEC-009](../../specs/009-meu-pluggy/spec.md) seleciona Meu Pluggy para integração automática Bradesco/Mercado Pago PF. [Plano vigente](../../plan/MEU-PLUGGY.md). Esta revisão prevalece sobre escolhas conflitantes abaixo; importação/local sem agregador é contingência, não caminho principal. Pesquisa pública permite seguir no planejamento, sem aprovação de dados reais.

Escopo: leitura de páginas/políticas públicas e advisories oficiais. Não houve auditoria interna dos provedores, acesso a contas, teste de invasão, contratação ou consulta a dados bancários reais. A pesquisa anterior avaliou viabilidade e preço; não representava aprovação de segurança. Esta revisão corrige essa distinção no planejamento.

## Resultado executivo

Nenhum fornecedor está aprovado para dados bancários reais. Documentação de criptografia/regulação não permite afirmar que um fornecedor nunca teve incidente ou que não pode vazar. Consulta pública sem notícia não é prova de ausência de vazamento. Compartilhamento previsto em contrato não é necessariamente vazamento, mas é exposição a terceiros que precisa atender ao objetivo do proprietário.

| Componente | Achado verificável | Limite / decisão |
|---|---|---|
| Pluggy | A política pública abrange dados financeiros, parceiros e tratamento em outros países | Não aprovada; esclarecer escopo do modo pessoal, destinatários e retenção |
| Meu Pluggy | Portal anuncia canais de IA/MCP/plataformas e também FAQ sobre senha; isso não demonstra quais recursos são opcionais nem quais caminhos bancários são usados | Não ativar integrações; confirmar Open Finance de cada banco e isolamento de funcionalidades |
| Supabase gerenciado | Documentação distingue região principal de suporte, logs/telemetria e outros tratamentos fora da região | Não aprovado; região Brasil não equivale a ausência de terceiros/transferências |
| Expo Go / ambiente de desenvolvimento | Ferramentas de debugging existem e Face ID tem limitação documentada | Manter somente sintéticos; gate de runtime antes de qualquer uso real |
| GitHub/CI e ferramentas de criação | Necessários para código/documentos, não para processar extratos | Somente código e sintéticos; sem credenciais/produção financeira acessíveis por ferramentas do desenvolvimento |

## Evidências e interpretações, sem inferências indevidas

**Pluggy.** [Política e termos públicos](https://www.pluggy.ai/legal) incluem parceiros no tratamento e armazenamento internacional; a coleta descrita é ampla e engloba credenciais. Isso não prova captura de senha em todo fluxo Open Finance, tampouco permite dispensar a confirmação por banco. O [PDF de privacidade vinculado](https://www.pluggy.ai/docs/politica-de-privacidade.pdf) explicita limites de garantia absoluta e retenção/eliminação com exceções. Não interpretar menção a AES/TLS como prova de que somente o usuário possui as chaves.

**Meu Pluggy.** A [página do portal](https://meu.pluggy.ai/en) anuncia recursos de IA, MCP e plataformas parceiras. É evidência de funcionalidades disponíveis, não evidência de que o extrato seja enviado automaticamente a qualquer IA. Falta comprovar separação dessas funções, destinatários, controles e termos efetivamente aplicáveis ao uso pessoal.

**Supabase.** O [FAQ de residência](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq) informa limites de residência regional e condições de acesso operacional. A [lista de subprocessadores de 12/10/2026](https://supabase.com/legal/subprocessor-list/October-12-2026.pdf) inclui serviços de hospedagem, monitoramento e linguagem natural. A presença de OpenAI nessa lista não comprova que tabelas bancárias sejam enviadas para modelos. É necessário identificar os fluxos relevantes e garantir que funcionalidades de IA/assistência não recebam conteúdo financeiro.

**Histórico de vulnerabilidades.** O [índice oficial de advisories do Auth](https://github.com/supabase/auth/security/advisories) contém vulnerabilidades publicadas. O [advisory de Apple/Azure](https://github.com/supabase/auth/security/advisories/GHSA-v36f-qvww-8w8m) não demonstra vazamento de dados do Orbe nem vulnerabilidade de uma versão que sequer foi instalada. Obriga verificar componente/versão/configuração quando houver seleção técnica. Ausência de advisory no monorepo principal não invalida os advisories de componentes.

**Ferramentas com IA.** A [análise oficial do Supabase sobre MCP](https://supabase.com/blog/defense-in-depth-mcp) descreve risco de prompt injection ao combinar dados privados e ferramentas. O plano do Orbe proíbe o acesso dessas ferramentas à produção financeira, inclusive read-only; não basta instruir o modelo a ignorar comandos em extratos.

## Perguntas pendentes antes de aprovar um provedor

1. Quais campos são lidos/armazenados, por quem, para quais finalidades e em quais países, neste plano específico?
2. Qual a lista de operadores/subprocessadores aplicável e quais acessam conteúdo, metadados ou somente a conta operacional?
3. Há envio a IA, enriquecimento, suporte, analytics ou treinamento? Como provar desativação/isolamento sem depender apenas de promessa promocional?
4. Como é feita a autorização de cada banco? Algum fluxo exige senha do banco fora do app/site oficial? Se sim, não homologar esse caminho.
5. Quem consegue descriptografar dados e acessar backups? Como acesso humano excepcional é autorizado, auditado e comunicado?
6. Quais prazos e exceções de retenção/exclusão, inclusive backup e após revogação? Existe evidência aplicável ao plano gratuito?
7. Que relatórios de auditoria/incidentes, correções e compromissos de notificação estão disponíveis? Não equiparar selo a auditoria da integração do Orbe.

As perguntas estão registradas para investigação posterior; nenhum contato foi enviado a fornecedor. Sem resposta satisfatória, integração permanece desabilitada. Gratuidade é secundária à privacidade.

## O que foi e não foi enviado nesta investigação

Foram consultados documentos e termos públicos usando buscas técnicas. Nomes dos bancos e contexto de arquitetura podem constar nas consultas; isso também é metadado a minimizar. Não foram fornecidos extratos, saldos pessoais, CPF, números de conta, senhas bancárias ou tokens do Orbe. Não há banco/conta de produção do Orbe disponível nesta etapa. Esta constatação tem escopo da investigação, não audita todas as ferramentas ou sessões anteriores de outros projetos.
