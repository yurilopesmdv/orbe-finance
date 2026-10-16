# T74 — Contrato mínimo da ponte Meu Pluggy

Estado: done como contrato documental, 16/10/2026. Base: d2dec67. Responsável: mantenedor da integração; execução sequencial, sem delegação. Requisitos: MPG-01/02/03/07, AUTH-01/02/03, OF-01/02/04/07/09. Nenhum endpoint, serviço, segredo ou conexão criado nesta task. Specs atualizadas antes deste contrato.

## Decisão e limites de confiança

Cliente Expo/TypeScript → Supabase Auth + Edge Function própria → API Pluggy → proxy pessoal. Projeto Supabase novo e independente do F1, ainda não provisionado. Postgres guarda somente metadados necessários a acesso/vínculos/limites. Não armazena saldos, movimentos, posições, categorias ou relatórios. Dados financeiros atravessam memória da ponte por requisição e ficam no aparelho somente após validação do runtime. TLS e criptografia gerenciada de repouso não impedem leitura pelo operador autorizado durante processamento; não chamar esta arquitetura de E2EE.

Atualização original do banco acontece na Pluggy independentemente do app. Cache/relatórios do Orbe atualizam ao abrir/retomar desbloqueado e consultar dados disponíveis. Sem cron, webhook ou worker financeiro no MVP. Respostas paginadas são montadas/validadas no cliente e promovidas por produto somente depois de lote completo; interrupção preserva versão anterior e permite repetir consulta. Não há promessa de snapshot global atômico de todos os produtos da API: datas e eventuais mudanças durante paginação precisam permanecer explícitas.

## Autenticação e autorização

- Uma identidade proprietária, provisionada administrativamente; cadastro público desligado. Supabase Auth por e-mail/senha, sem reutilizar credenciais bancárias.
- API exige sessão válida verificada server-side, com identidade do projeto e proprietário permitido. Chave pública do projeto não é sessão. Toda rota financeira/status aplica a mesma política antes de chamar Pluggy.
- Metadados sob RLS, sem escrita de vínculos pelo cliente. IDs internos opacos enviados no corpo; servidor resolve item/conta externos pela identidade autenticada. Não aceitar owner_id efetivo, URL externa ou item arbitrário fornecido pelo cliente.
- Vínculo inicial é operação administrativa privada: conta Pluggy dedicada ao próprio titular, item acessível na credencial dessa aplicação e conexão bancária original comprovada como Open Finance. Acessibilidade pela API, clientUserId e callback não provam titularidade por si. Não coletar CPF como prova por conveniência.
- Mesmo em app pessoal, testar segunda identidade, sessão expirada e troca de IDs. Rotas de status não revelam existência/configuração de secrets.
- Senha de no mínimo 12 caracteres; tokens em memória no Expo Go sintético, sem persistir senha. Ao bloquear, interromper consultas e exigir reautenticação; offline não desbloqueia sessão sintética inicial. Face ID é etapa de runtime compatível e não substitui sessão HTTP.
- Recuperação Auth por código/fluxo HTTPS validado em T02, sem valores financeiros. SMTP/destino de e-mail entram no inventário antes de uso real; serviço ainda não contratado.

## Metadados e retenção planejada

| Local | Dados mínimos | Retenção / exclusão |
|---|---|---|
| Auth gerenciado | identidade, hash de senha e sessões do proprietário | Até exclusão de conta, com revogação; backups/retencão operacional confirmados em T47/T56 |
| Postgres | vínculo owner/conexão/item/conta, banco, capacidades/estado/datas, lease/cooldown | Enquanto conectado; apagar vínculos ao excluir e rejeitar chamadas em curso pela versão/estado da conexão |
| Limites e leases | identidade interna, contador e expiração, sem payload | Lease máximo 60s; contadores expiram em 24h; TTL é contrato a testar |
| Segredos backend | Client ID/Secret Pluggy e credenciais técnicas mínimas | Secret store; rotação/revogação ao encerrar; nunca em tabelas legíveis pelo app |
| Memória da ponte | API key temporária, respostas financeiras por requisição | Sem cache persistente, arquivo temporário ou dump; memória liberada ao término sem promessa de zeragem perfeita |
| Aparelho | lotes normalizados, categorias/metas e relatórios | Até logout/reset/exclusão conforme política de chave/runtime; não ativar backup sem decisão/teste |
| Telemetria própria | ID aleatório de requisição, código genérico, duração | Desligada por padrão; eventual ativação sem conteúdo/IDs bancários exige retenção definida |
| Meu Pluggy | conteúdo financeiro e consentimentos | Conforme termos do fornecedor; revogar conexão não prova exclusão de todos os backups |

IDs/vínculos são sensíveis mesmo sem valores; ficam fora de logs e ferramentas. Provedor de infraestrutura pode reter logs próprios: T47/T52/T56 devem verificar alcance, expiração e backups antes de dados reais. Se não houver controle adequado, uso real permanece bloqueado; não registrar prazo inventado como política efetiva do fornecedor.

## Operações lógicas da ponte

Endpoints abaixo são contratos do Orbe a implementar; não são rotas já existentes nem nomes da API Pluggy. POST evita inserir identificadores bancários em query/path de acesso. Corpo não pode ser registrado. Todas as respostas financeiras: Cache-Control: no-store.

| Operação | Entrada validada | Saída mínima |
|---|---|---|
| POST /connections/status | Sem owner/item externo | Conexões internas do proprietário, capacidades, fonte e datas, sem credenciais |
| POST /accounts/read | ID interno de conexão | Contas normalizadas; vínculo de conta criado/validado pelo servidor |
| POST /transactions/read | ID interno de conta, período e cursor opaco limitado | Página normalizada e metadados de continuidade/completude |
| POST /investments/read | ID interno de conexão e cursor limitado | Página de posições, ausência/erro por produto, moeda e data |
| POST /connections/pause | Conexão interna e confirmação | Versão/estado alterado; novas coletas negadas |
| POST /connections/remove | Conexão interna e sessão recentemente reautenticada | Vínculo apagado e instrução de revogação/exclusão no fornecedor |

Não há rota cliente de cadastrar item externo, listar secrets, executar URL ou pagamentos. Normalizador descarta campos de identidade/PII desnecessários antes de devolver conteúdo. Conta retornada deve pertencer ao item permitido; se API não fornecer relação suficiente, derivar por consulta autenticada do item e negar vínculo ambíguo. Nunca aceitar mera coincidência de nome do banco como prova.

Pedidos inválidos falham antes da API Pluggy: 401 sem sessão, 403 identidade sem acesso, 404 genérico para recurso sem vínculo, 400 entrada inválida, 429 limite. Erros do fornecedor viram códigos internos sanitizados; não devolver stack, URL, headers ou payload bruto. Schema estrito e limite de corpo 16 KiB, sem texto livre/URLs. Paginação valida limites; timeout total de 20s por requisição, sem repetir indefinidamente. Quotas reais serão medidas em T03/T76; parâmetros são limites propostos do Orbe, não SLA da Pluggy.

## Capacidades pessoais e Open Finance

Guia pessoal: uso próprio gratuito, até cinco conexões, proxy com atualização diária; sem listagem global de itens ou refresh forçado. Backend mantém lista autorizada. Para dados disponíveis, no máximo uma leitura de lote por conexão a cada 15 minutos e uma em execução por conexão; paginação autenticada pertence ao mesmo lote e não é bloqueada pelo cooldown. Tentativas com erro retomam respeitando Retry-After/backoff limitado; não burlar rate limit com novos IDs.

**Limite ainda não comprovado:** a documentação de conectores Open Finance empresariais menciona habilitação comercial, enquanto o guia pessoal descreve um proxy gratuito. São contextos diferentes. Não concluir que o premium comercial se aplica ao proxy nem que toda origem do Meu Pluggy usa Open Finance. T03/T77 precisam confirmar trilha original e cobertura de Bradesco/MP; sem comprovação, não habilitar banco real nem substituir por conector que peça senha bancária. Produtos não retornados permanecem indisponíveis.

Gratuidade do acesso pessoal não inclui garantia de hospedagem/SMTP/distribuição grátis. Nenhum recurso pago será contratado automaticamente. Permanecem necessárias revisão de fornecedor, runtime e gate T63/T78.

## Aceite da T74 e próxima task

Concluído documentalmente: provedor/Auth selecionados para ambiente sintético, identidade e vínculos definidos, retenção por destino, segredos/rotas limitados, diferença entre atualização da fonte e cache local, limitações de custo/cobertura registradas e backlog ajustado. Validar estrutura por links/requisitos/grafo/diff. Não declarar testes HTTP/RLS, integração real ou auditoria executados.

Próxima task: T01, matriz de compatibilidade e paths do projeto, executada isoladamente. T02 implementa/valida depois o spike de acesso no runtime escolhido; T03 confirma a viabilidade comercial/Open Finance, sem dados reais nas ferramentas.

## Fontes primárias consultadas em 16/10/2026

- [Guia pessoal Pluggy](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use).
- [API pessoal](https://meu.pluggy.ai/api-guide).
- [Autenticação do Connect](https://docs.pluggy.ai/en/docs/connect-widget/authentication).
- [Conectores Open Finance](https://docs.pluggy.ai/en/docs/open-finance/overview).
- [Segurança Edge Functions](https://supabase.com/docs/guides/functions/auth).
- [Autenticação por senha](https://supabase.com/docs/guides/auth/passwords).

São contratos de produto apoiados em documentação pública; versões e comportamento serão testados antes de confiar em SDK/serviço.
