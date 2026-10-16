# Plano vigente — Meu Pluggy, revisão 0.4

Deriva da [SPEC-009](../specs/009-meu-pluggy/spec.md), que prevalece sobre escolhas conflitantes da revisão 0.3. Implementação autorizada em 16/10/2026, uma task por vez. O fluxo principal é automático; a origem financeira é exclusivamente Open Finance.

## Arquitetura proposta e fronteiras de confiança

Banco → Meu Pluggy → ponte privada autenticada → app. Classificação e relatórios ficam no iPhone por padrão, com persistência local protegida no runtime validado. Pluggy e ponte processam dados financeiros: esta arquitetura não impede tecnicamente que esses operadores os leiam. Minimizar retenção na ponte, evitar persistência de payload bancário por padrão e registrar eventual necessidade antes de criar tabelas/workers. Guardar apenas configuração/vínculos/cursores estritamente necessários conforme contrato aprovado.

Segredos do fornecedor permanecem no servidor. A ponte usa autenticação do proprietário e autorização por vínculo interno de item/conta. Cadastro público desativado. Desbloqueio local e sessão do servidor são controles distintos; não reutilizar uma senha local como segredo de API. Definir provedor Auth, recuperação e armazenamento de sessão antes de bootstrap. Não assumir que RLS protege dados em memória/logs ou que Face ID autentica requisições HTTP.

## Sequência de pequenas entregas

1. T74 concluiu o [contrato mínimo](T74-BRIDGE-CONTRACT.md), que define o acesso ao proxy pessoal, destinatários, retenção/chaves e autenticação da ponte com dados sintéticos. Atualizar as tasks cloud reaproveitadas antes de executá-las; não copiar automaticamente todo o desenho gerenciado antigo.
2. T01/T02/T04/T05 e T47–T49 fecham runtime, acesso, domínio, wireframes e riscos. T65 continua útil para runtime; autenticação local T66 é complementar à sessão da ponte. Nenhum controle nativo é declarado funcional no Expo Go sem prova.
3. Com implementação autorizada, adaptar T07–T27 ao contrato T74, com ponte mínima e ingestão de respostas simuladas. Só armazenar no servidor aquilo explicitamente definido.
4. T75 verifica autenticação/autorização de todas as rotas, incluindo status/configuração; T76 fecha itens permitidos, cadência e falhas do proxy. Reaproveitar testes de egress/logs e relatórios T50–T62.
5. T77 homologa matriz de cobertura sintética e prepara comparação privada de Bradesco/MP; não afirmar cofrinhos disponíveis a partir de documentação genérica. Incidentes operacionais não são prova de incidente de segurança.
6. T78 consolida evidências técnicas com T63 antes de conectar banco real. Depois, homologação privada pelo titular, somente Bradesco/MP. T39/T40 permanecem expansão. Revisar riscos/resultado de cobertura antes de declarar produto completo.

## Uso pessoal e sincronização

Documentação consultada descreve até cinco conexões pessoais e atualização automática diária; validar termos/capacidades novamente na implementação. Proxy pessoal não oferece listagem genérica de itens nem atualização manual via PATCH: obter IDs por fluxo autorizado e mantê-los vinculados ao proprietário. Definir retorno do consentimento e reentrada do app com fixtures; não depender de webhook, SDK nativo ou callback que não tenha sido comprovado no plano/runtime.

A infraestrutura da ponte pode ter custo mesmo com acesso pessoal gratuito. Nenhum recurso foi contratado. Exclusão/revogação envolve aparelho, ponte e fornecedor separadamente; confirmar retenção/backup e evitar promessa de apagamento instantâneo universal.

## Continuidade

T74/T01 concluídas documentalmente; próxima task T02. Execução sequencial autorizada. Ao retomar, ler STATE, SPEC-009 e pesquisa pública; revisar alertas/cobertura na data do desenvolvimento. Nenhum scan de dependências do Orbe rodou, pois não há dependências/lockfile. Pesquisa pública não é teste de integração.

## Contrato aplicável

[T74](T74-BRIDGE-CONTRACT.md) define a ponte sem persistência financeira, Supabase Auth/Functions e metadados sob RLS. Webhook/cron desligados inicialmente. Atualização bancária no fornecedor independe do app; cache local consulta ao abrir/retomar desbloqueado. O contrato prevalece sobre hipóteses anteriores de worker e relatórios no servidor.

[T01](T01-RUNTIME-STRUCTURE.md) fixa SDK57 e Node22.23.2/npm12.2.0 para o cliente confirmado pelo proprietário. T02 é a próxima task; não adotar latest ou alterar o ambiente global.
