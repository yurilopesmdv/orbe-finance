# Investigação de viabilidade

Data: 16/10/2026. Repositório inicial: somente README, sem dependências, app, CI ou configuração. Nome no README inicial era orbe-financing; nome adotado: Orbe Finance, repo orbe-finance. Nenhum arquivo, segredo, banco ou configuração do Bolão F1 foi reutilizado. [Fontes detalhadas](SOURCES.md).

## Conclusões de runtime

Face ID não está disponível no Expo Go para iOS; requer development build, segundo [Expo LocalAuthentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/). A modalidade biométrica requireAuthentication do SecureStore também possui restrição nesse ambiente ([SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)). Portanto: senha na primeira entrega e Face ID condicionado à distribuição nativa futura. Não prometer resolver apenas adicionando configuração JavaScript.

Expo Go também não permite personalizar o scheme como um app próprio para os fluxos OAuth/OIDC descritos pelo Expo ([autenticação](https://docs.expo.dev/guides/authentication/)). A inferência de projeto é começar com autorização no portal do provedor e retorno manual ao Orbe, mantendo login por senha. Isso evita assumir que qualquer SDK bancário React Native funcionará dentro do Expo Go. O fluxo real ainda precisa ser validado no iPhone; se falhar, registrar a limitação antes de ampliar o escopo.

## Comparação para este caso

| Caminho | Evidência pública consultada | Adequação proposta |
|---|---|---|
| Meu Pluggy + conector MeuPluggy | [Guia pessoal](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use): gratuito, uso próprio, até 5 conexões, sem expiração do trial pessoal | Candidato prioritário para quatro bancos; autorização externa e cobertura ainda precisam de prova |
| Pluggy Dados comercial | [Preços](https://www.pluggy.ai/precos): a partir de R$ 2.500/mês e trial de 15 dias | Fora da prioridade de custo atual; não ativar trial como se fosse solução gratuita permanente |
| Belvo Launch | [Preços](https://belvo.com/pt-br/planos-precos/): R$ 1.500/mês; sandbox separado da utilização comercial | Alternativa técnica para comparação, sem contratação; não assumir produção gratuita |
| Participação direta no ecossistema | [BCB](https://bcb.gov.br/meubc/faqs/s/open-finance) descreve participação regulada e consentimento | Não presumir acesso direto de app pessoal a todos os bancos; não é a proposta inicial |

Valores são referências da consulta, não orçamento fechado. Eventuais custos de backend, e-mail, quotas e distribuição são independentes do agregador; camada gratuita precisa ser conferida na conta escolhida. “Gratuito” não implica SLA, atualização instantânea nem cobertura garantida. Não houve assinatura, criação de conta ou teste de produção.

## Modo pessoal: limites que afetam o desenho

O [guia do Meu Pluggy](https://meu.pluggy.ai/api-guide) orienta guardar IDs e consultar itens conhecidos; GET /v2/items não está disponível para esse uso. O [ciclo de item](https://docs.pluggy.ai/en/docs/connections/item) diferencia o original atualizado a cada 24 horas do proxy, que reflete esses dados e não aceita atualização manual. Isso orienta o botão Buscar dados disponíveis e reconciliação limitada, não polling para forçar o banco.

A escolha do conector proxy não determina o tipo da conexão original. Antes de homologar, registrar se cada banco foi autorizado por Open Finance, o produto/contexto usado e os recursos efetivos. Não substituir silenciosamente por captura de senha bancária.

## Cobertura e cofrinhos

As tabelas oficiais incluem os quatro bancos em [instituições Open Finance](https://docs.pluggy.ai/en/docs/open-finance/institutions-coverage), mas são agregações de contextos. [Subtipos de investimento](https://docs.pluggy.ai/en/docs/open-finance/investments) variam por conector; não concluir que toda aplicação ou nome de caixinha estará disponível.

A [referência de conta](https://docs.pluggy.ai/en/reference/account/accounts-retrieve) descreve reservedBalances condicionado ao que a instituição expõe, incluindo reservas que podem não ser metas. A [referência de investimento](https://docs.pluggy.ai/en/docs/products/investments) descreve posições e valores. Hipótese do Orbe: a reserva pode ser representação sobreposta de um ativo; será reconciliada, não somada automaticamente. [Matriz por banco](BANK-COVERAGE.md).

## Segurança e integração

A [autenticação Pluggy](https://docs.pluggy.ai/en/docs/connect-widget/authentication) mantém segredos no servidor e entrega token restrito ao cliente. A [documentação de widget](https://docs.pluggy.ai/en/docs/connect-widget/environments) alerta que callback de sucesso não garante integridade. [Webhooks](https://docs.pluggy.ai/en/docs/developer-tools/webhooks-ref) requerem resposta rápida; a proposta é persistir evento/job antes do processamento e validar mecanismo de autenticidade realmente oferecido.

O backend gerenciado é uma proposta baseada em [senha Supabase](https://supabase.com/docs/guides/auth/passwords) e [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), em projeto separado. Isso não comprova que a nova aplicação esteja segura: será necessário testar políticas, ownership, jobs e credenciais. A interpretação regulatória do fornecedor não dispensa registrar armazenamento/retencão e tratamento no Orbe.

## Resultado inicial de viabilidade

Viável como proposta de app pessoal com senha, consolidação assíncrona e caminho gratuito sujeito à homologação dos quatro bancos. Face ID não é viável mantendo exclusivamente Expo Go iOS. Conexão integral dentro do Orbe, cofrinhos nominados e atualização imediata não estão comprovados. Próximo passo é fechar contratos e depois executar spikes autorizados, não instalar SDKs nesta etapa.

## Revisão de segurança posterior

A conclusão de viabilidade acima não é aprovação de privacidade. A [revisão de fornecedores](../security/VENDOR-REVIEW.md) identificou lacunas contratuais e de acesso. Pluggy/Meu Pluggy e Supabase permanecem não aprovados para conteúdo financeiro real; a escolha fica suspensa até resolver o gate de [ameaças e destinos](../security/THREAT-MODEL.md). Expo Go continua útil para protótipo sintético, sem implicar aceite para produção financeira.
