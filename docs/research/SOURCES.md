# Fontes e evidências

Consulta: 16/10/2026. Fontes primárias; conteúdo/preço/cobertura podem mudar. A consulta documental não comprova resposta de uma conta bancária específica. Não houve login em portais, contrato, chamada autenticada ou coleta de dados financeiros. Revalidar termos, campos e compatibilidade no início das tasks relacionadas.

| ID | Fonte | O que sustenta |
|---|---|---|
| S01 | [Expo LocalAuthentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/) | Restrição de Face ID no Expo Go iOS e necessidade de development build |
| S02 | [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) | Armazenamento de segredos e limitação de requireAuthentication no Expo Go |
| S03 | [Expo OAuth](https://docs.expo.dev/guides/authentication/) | Scheme próprio e limitações de OAuth/OIDC no Expo Go |
| S04 | [Expo: começar desenvolvimento](https://docs.expo.dev/get-started/start-developing/) | Compatibilidade de runtime e fluxo em dispositivo |
| S05 | [Pluggy: uso pessoal](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use) | Modalidade pessoal gratuita, limite de conexões e fluxo de vinculação |
| S06 | [Meu Pluggy: guia de API](https://meu.pluggy.ai/api-guide) | Itens conhecidos, indisponibilidade de listagem global, leitura de contas/transações/investimentos |
| S07 | [Pluggy: preços](https://www.pluggy.ai/precos) | Diferença entre portal pessoal, conector pessoal, trial e API comercial |
| S08 | [Pluggy: ciclo de item](https://docs.pluggy.ai/en/docs/connections/item) | Atualização do item original versus item proxy |
| S09 | [Pluggy: instituições OF](https://docs.pluggy.ai/en/docs/open-finance/institutions-coverage) | Cobertura publicada dos quatro bancos; produto por contexto/conector |
| S10 | [Pluggy: investimentos OF](https://docs.pluggy.ai/en/docs/open-finance/investments) | Subtipos por instituição; cobertura não é igual entre bancos |
| S11 | [Pluggy: conta](https://docs.pluggy.ai/en/reference/account/accounts-retrieve) | bankData, reservedBalances e natureza condicional da reserva |
| S12 | [Pluggy: investimentos](https://docs.pluggy.ai/en/docs/products/investments) | Campos de posição, impostos/valores e possíveis representações de reservas |
| S13 | [Pluggy: widget e ambientes](https://docs.pluggy.ai/en/docs/connect-widget/environments) | Sandbox/live, SDKs e diferença entre callback de UX e evidência de negócio |
| S14 | [Pluggy: autenticação do widget](https://docs.pluggy.ai/en/docs/connect-widget/authentication) | Segredos no backend e token restrito no cliente |
| S15 | [Pluggy: OAuth](https://docs.pluggy.ai/en/docs/connect-widget/oauth-support) | Requisitos de retorno e avaliação de fluxo móvel |
| S16 | [Pluggy: webhooks](https://docs.pluggy.ai/en/docs/developer-tools/webhooks-ref) | Entrega/retry e necessidade de processamento fora da resposta |
| S17 | [Belvo: preços](https://belvo.com/pt-br/planos-precos/) | Plano Launch, sandbox e condição comercial |
| S18 | [Belvo: investimentos Brasil](https://developers.belvo.com/pt-br/apis/belvoopenapispec/investments-brazil) | Existência de recurso de investimentos; não confirma cobertura individual |
| S19 | [BCB: Open Finance](https://bcb.gov.br/meubc/faqs/s/open-finance) | Consentimento, participantes e escopo compartilhável |
| S20 | [BCB: tipos de dados](https://www.bcb.gov.br/meubc/faqs/p/tipos-de-dados-e-servicos-que-podem-ser-compartilhados-com-o-open-finance) | Contas, cartões, investimentos; credenciais bancárias não compartilhadas |
| S21 | [Supabase: senha](https://supabase.com/docs/guides/auth/passwords) | Autenticação/recuperação gerenciada a validar no runtime escolhido |
| S22 | [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Autorização por linha e uso seguro do acesso cliente |

## Classificação de afirmações

**Confirmado documentalmente:** texto publicado nas fontes acima. **Proposto:** escolha de arquitetura/regra do Orbe. **Pendente de teste:** comportamento com SDK, plano, conta e aparelho reais. **Homologado:** somente depois de evidência de execução, data e resultado.

Guias de fornecedores podem conter simplificações de produto, inclusive exemplos que agrupam “caixinhas” sob CDB. Não converter isso em regra universal sobre Nubank, Mercado Pago, Bradesco ou Inter. Campo e resposta real prevalecem na homologação; nenhum trecho promocional substitui a análise de tratamento de dados no backend do Orbe.

## Fontes da revisão de privacidade

Consultadas em 16/10/2026; leitura pública, sem conteúdo bancário real. Documentos publicados não constituem garantia de ausência de incidente.

| ID | Fonte primária | Uso na revisão |
|---|---|---|
| S23 | [Pluggy: termos e privacidade](https://www.pluggy.ai/legal) | Escopo amplo, parceiros, tratamento internacional e controles declarados |
| S24 | [Pluggy: PDF de privacidade](https://www.pluggy.ai/docs/politica-de-privacidade.pdf) | Limites de garantia/eliminação e necessidade de esclarecimento do plano aplicável |
| S25 | [Meu Pluggy: portal](https://meu.pluggy.ai/en) | Funcionalidades IA/MCP/plataformas; não comprova envio automático a essas funções |
| S26 | [Supabase: residência](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq) | Diferença entre região principal e operações externas |
| S27 | [Supabase: subprocessadores](https://supabase.com/legal/subprocessor-list/October-12-2026.pdf) | Lista publicada; presença de fornecedor não prova conteúdo financeiro enviado |
| S28 | [Supabase: advisories Auth](https://github.com/supabase/auth/security/advisories) | Vulnerabilidades por componente, sem inferir vazamento do Orbe |
| S29 | [Supabase: advisory Apple/Azure](https://github.com/supabase/auth/security/advisories/GHSA-v36f-qvww-8w8m) | Exemplo concreto para futura revisão de versão/configuração |
| S30 | [Supabase: defesa em MCP](https://supabase.com/blog/defense-in-depth-mcp) | Risco de conteúdo não confiável junto a ferramentas e dados privados |
| S31 | [Expo: captura de tela](https://docs.expo.dev/versions/latest/sdk/screen-capture/) | Capacidades que precisam de teste em aparelho; sem garantia universal |
| S32 | [Expo: ferramentas de depuração](https://docs.expo.dev/debugging/tools/) | Superfície do ambiente dev a separar de conteúdo real |
| S33 | [OWASP MASVS](https://mas.owasp.org/MASVS/) | Organização dos controles e testes móveis; não certificação |

A ausência de resultado em busca pública de incidentes não foi usada como evidência de segurança. Não foram realizadas consultas a dumps, credenciais vazadas ou dados de terceiros.
