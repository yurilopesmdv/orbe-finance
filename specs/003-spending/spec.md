# SPEC-003 — Gastos, tipos e categorias

Estado: ready para R1 sintética; dados reais continuam bloqueados. Depende de SPEC-000/002. A classificação do Orbe é separada dos dados importados, para que a próxima sincronização não apague a escolha do usuário.

| ID | Requisito |
|---|---|
| EXP-01 | DEVE mostrar transações por período, banco, conta, tipo e categoria, com pesquisa e paginação |
| EXP-02 | DEVE distinguir receita, despesa, transferência própria, aporte, resgate, rendimento, estorno e desconhecido; direção crédito/débito é campo separado |
| EXP-03 | DEVE oferecer categorias iniciais e personalizadas, opção Sem categoria e exclusão/arquivamento sem perder histórico |
| EXP-04 | DEVE preservar correção manual acima de regras do usuário, categoria de provedor e fallback; automatismo nunca sobrescreve override |
| EXP-05 | DEVE calcular despesas mensais apenas com movimentos efetivados classificados como despesa e ajustar estornos vinculados sem duplicidade |
| EXP-06 | DEVE identificar possíveis transferências próprias sem assumir que todo Pix é transferência; confirmação/correção fica disponível |
| EXP-07 | DEVE separar compras de cartão do pagamento da fatura e explicar a base do relatório quando houver cobertura parcial |

Categorias iniciais propostas: moradia, alimentação, transporte, saúde, educação, lazer, assinaturas, impostos/taxas, compras e outros. Tipos são fatos financeiros; categorias são organização do consumo. Uma transferência não vira consumo só por receber categoria Alimentação. Regras determinísticas iniciais por descrição normalizada, conta e direção; nenhuma chamada a IA ou enriquecimento pago é necessária.

## Regras de cálculo e integridade

- Data para o mês: data de efetivação fornecida; datas puras não sofrem deslocamento por fuso. Instantes são UTC e apresentados em America/Sao_Paulo.
- Valores monetários em centavos inteiros por moeda; quantidades e taxas usam decimal. Não usar ponto flutuante binário para somar dinheiro. Valores ausentes ficam null.
- Débito/crédito é normalizado no adaptador e não inferido apenas do sinal. Guardar valor de origem e convenção usada para auditoria restrita.
- Despesa líquida = despesas efetivadas do período − estornos efetivados vinculados no período. Cancelada excluída; pendente aparece em seção separada. Estorno de compra de outro mês ajusta o mês de efetivação do estorno, mantendo vínculo ao original.
- Transferências próprias, aportes e resgates não entram como gasto/receita de consumo. Rendimento aparece separado; não misturar com salário sem escolha explícita.
- Pareamento automático de transferências somente com identificador confiável entre contas do mesmo titular. Coincidência de valor/data/descrição gera sugestão; não altera total silenciosamente.
- Mesma transação em conexão antiga/nova exige reconciliação por identificador estável; heurística de semelhança não apaga movimentos automaticamente.
- Se cartão ainda não estiver integrado, identificar relatório como movimentações de conta e pagamento de fatura como saída não detalhada, sem afirmar gasto por categoria completo. Ao integrar compras, pagamento da fatura passa a liquidação e não nova despesa; histórico requer recomposição versionada.

## Aceite

- AC-E01: compra de R$ 100 e estorno vinculado de R$ 20 no mesmo mês resultam em R$ 80; repetição do evento não altera isso.
- AC-E02: R$ 500 entre contas próprias não vira R$ 500 de receita e despesa; Pix a terceiro continua candidato a despesa.
- AC-E03: alteração manual para Saúde permanece após sincronização e mudança de categoria do provedor.
- AC-E04: R$ 0,10 + R$ 0,20 totalizam R$ 0,30; moeda estrangeira permanece fora do total BRL.
- AC-E05: compra de cartão R$ 200 + pagamento de fatura R$ 200 não geram R$ 400 de gasto.
- AC-E06: data 2026-10-01 permanece em outubro, inclusive em dispositivo de outro fuso; pendências/cancelamentos são distinguíveis.
- AC-E07: resumo por categoria fecha com lista detalhada para os mesmos filtros e versão de classificação; Sem categoria não some do total.

## Contrato monetário T04

BRL em centavos inteiros seguros (Number.isSafeInteger), entrada monetária decimal como string, sem parseFloat/arredondamento silencioso. Rejeitar casas além de duas, notação exponencial, NaN/infinito e overflow; null continua ausência, diferente de zero. Valor de movimento é magnitude não negativa; direção é campo obrigatório separado. Soma também precisa permanecer inteira segura. Moedas distintas não são somadas. Data civil estrita YYYY-MM-DD mantém o mês; timestamp exige offset/Z e é agrupado em America/Sao_Paulo. Identidade de lote é (fonte, conta, ID externo), nunca só descrição/data/valor. Contrato detalhado e casos em T04.

## Interface pura T26

Entradas canônicas incluem fonte/conta/ID externo, magnitude em centavos, moeda, direção, tipo, estado e data. Mesmo ID com conteúdo financeiro divergente é conflito, não atualização decidida pela ordem da lista; ingestão deve resolver versão antes do domínio. Estorno só reduz gasto se referência ao original efetivado de despesa puder ser confirmada no conjunto fornecido, inclusive fora do mês filtrado. Caso contrário, marcar parcial e preservar item para revisão. Tipos desconhecidos ou valores ausentes tornam a análise parcial. Pagamento de fatura classificado como liquidação não é nova despesa; relatório deve indicar sua base de cobertura.

## Interface pura T25 — classificação

Classificar categoria e tipo separadamente, preservando origem de cada campo: override explícito > primeira regra aplicável > provedor > fallback. Override null de categoria significa Sem categoria e bloqueia fallback; propriedade ausente significa sem override. Tipo fallback é unknown. Catálogo deve ser previamente autorizado pela camada de dados; domínio não substitui isolamento/RLS. IDs duplicados são rejeitados.

Categoria arquivada permanece em override histórico; regras/provedor só podem atribuir categorias ativas. Categoria removida vira Sem categoria e exige revisão, sem descartar movimento. Regra usa trecho literal normalizado (acentos/maiúsculas/espaços), conta/direção opcionais, prioridade numérica menor primeiro e ID como desempate estável; campos ausentes não sobrescrevem outro campo. Nada de regex, IA ou rede. Regras não podem atribuir transferência própria automaticamente; provedor só pode fazê-lo com vínculo confiável entre contas próprias. Sem confirmação, tipo unknown e revisão necessária. Override explícito pode confirmar transferência própria.

## Consulta local T27a

Lote previamente autorizado, canônico e classificado em memória; esta função não autentica nem busca dados. Validar duplicatas/conflitos antes de filtrar. Filtros por mês, conta, instituição, tipo, categoria (null = Sem categoria) e trecho de descrição. Ordenação por data civil/instante em Brasília desc e identidade estável no empate; página não muda resumo do conjunto completo filtrado. Originais necessários à validação de estornos ficam disponíveis ao cálculo mesmo fora da página/mês, mas não são exibidos como resultados extras. Moeda explícita, parcialidade da fonte preservada, nenhum movimento financeiro persistido pela consulta.

Cálculo de despesas pode receber evidências de originais separadas dos movimentos selecionados: originais validam vínculo de estorno, mas nunca entram no total por estarem apenas no conjunto de evidência. Não alterar datas ou conteúdo para excluir um original do total.

## Recorte T30a — lista demonstrativa

Lista usa consulta T27a, com período, instituição, tipo, categoria e busca. Resumo acompanha todos os filtros, independentemente da página. Detalhe informa estado, origem e data; permite categoria/tipo de exemplo em memória, sem editar lançamento original. Correções são armazenadas separadas da origem e reaplicadas ao recarregar o lote demonstrativo na sessão. Reiniciar/sair encerra a demonstração; persistência privada e sincronização real ficam T30b/T27b/T14. A UI explica essa limitação. Filtro ativo não é perdido ao abrir/fechar detalhe; Sem categoria é seleção explícita. Valores obedecem ocultação compartilhada.

## Recorte T14a — ledger volátil por sessão

Repositório em memória, sem SQLite/AsyncStorage/arquivo/rede; principal e geração vêm de guard injetado, nunca owner_id escolhido por filtro. Cada operação exige sessão desbloqueada igual ao principal/geração inicial. Troca de usuário/geração ou bloqueio invalida e purga o repositório; fechamento explícito também impede novos acessos. Registros de entrada declaram ownerSubject e são recusados se divergem. Isso é contrato sintético e não prova integração privada com Auth/runtime.

Importação tem escopo fonte/conta/mês e ticket opaco em memória. Apenas o último ticket iniciado nesse escopo pode promover lote explicitamente completo (máximo10.000 entradas, sem truncar). Validar todo lote antes de trocar estado; página incompleta/conflito/erro preserva versão anterior. Mesma identidade pode mudar em novo lote completo; ausentes não são apagados por inferência. Duplicatas conflitantes dentro do lote são erro. Paginação/normalização/datas de leitura reais continuam T20/T22.

Categorias/regras/overrides ficam separados dos fatos da fonte. Override por identidade canônica permanece após promoção; categoria arquivada permanece histórica, porém não pode receber novas regras/atribuições. Nenhum patch pode referenciar categoria inexistente/registro de outro escopo. Leitura retorna cópia e aplica precedência T25; Sem categoria mantém valor. Tipo canonical own_transfer pressupõe confirmação pelo normalizador, nunca texto Pix. Persistência privada e principal Auth real ficam T14b após gate de runtime; não usar este ledger para finanças reais em Expo Go.

Promoção T14a preserva todas as moedas, validando cada conjunto sem converter nem filtrar entradas estrangeiras. Mesmo ID já confirmado em outro mês gera conflito de período, sem decidir por ordem de chegada; remanejamento real de data exigirá reconciliação explícita/versionada T22.

O guard de memória é verificado em cada operação; ao detectar perda de sessão, invalida/purga o store. A integração T14b deverá chamar close imediatamente no evento de bloqueio; o port síncrono sozinho não assina eventos de Auth. Não apresentar essa checagem sob demanda como prova de purge imediato da UI/cache real.

## T26b — apresentação monetária exata

Formatter não divide centavos Number por100 para produzir fração em ponto flutuante. Separar parte inteira e resto por BigInt; formatar apenas unidade inteira segura com Intl e inserir os dois dígitos originais no campo fraction, inclusive negativos menores que1 unidade. Preservar moeda explícita sem conversão. MAX_SAFE_INTEGER centavos termina em ,91, nunca ,90.

UI usa o mesmo label no texto e accessibilityLabel. Oculto retorna somente Valor oculto sem formatar valor; null é Não informado; entrada inválida não arredonda nem imprime conteúdo, recebe Valor indisponível na UI. Helper estrito lança código genérico para integração/teste. Não alterar layout.

## T51a — referências canônicas escalares

reversalOf ausente é undefined; quando presente deve ser objeto com exatamente source/accountId/externalId, todos strings não vazias. Null/array/número/objeto aninhado/campos extras não são referência válida e falham antes de fingerprint/cache. Referência válida ao original ainda não recebido continua parcial, não erro estrutural. Payload raw nunca pode entrar disfarçado em identificador canônico.

## EXP-10 — DTO interno de movimentos por conta/mês (T22a)

Normalizador DEVE ficar desligado antes de tocar conteúdo/contexto. DTO da ponte futura usa IDs internos opacos, conexão/conta vinculadas, centavos não negativos ou null, moeda/direção/status/tipo explícitos e data estrita no mês de Brasília solicitado. Não traduz payload Pluggy nem infere direção pelo sinal. Identidade local conserva campo legado externalId, mas seu conteúdo nesta fronteira é movementId interno; método estável de derivação sem persistência de payload fica no adapter futuro.

Descrição mínima local limitada240caracteres, texto literal sem executar HTML/URL/instruções; extras/CPF/número/credenciais não são projetados. Categoria só se estiver no catálogo autorizado; transferência própria só com movimento no conjunto de evidência confiável, senão tipo unknown/parcial. Estorno sem referência fica parcial; referência só para conta permitida da mesma conexão, nunca correspondência por valor/descrição. Pending/cancelled permanecem explícitos, sem gasto contabilizado. Override é do ledger, não do DTO, e não é sobrescrito pela normalização.

Separar fim de paginação de janela completa: nextCursornull não comprova cobertura histórica. Flags windowComplete e fonte datada determinam parcialidade; vazio/ausência não representa exclusão. Duplicata idêntica idempotente, conflito invalida página; limite1000 registros/cursor512, contexto limitado. T22a não move registros entre meses, cria vínculo nem promove cache. Atualização/cancelamento e staging serão T22b; fonte real e política incremental T22c. Origem/convenção monetária só podem ser documentadas em metadata do adapter revisado; não autorizar retenção de payload bruto pelo requisito anterior.

## EXP-11 — Publicação atômica de movimentos multi-conta (T22b1)

Ledger em memória DEVE aceitar conjunto limitado de tickets de contas distintas do mesmo source/mês, validar todos os candidatos antes de uma única troca de referência e verificar todos os tickets novamente após guard de commit. Conjunto vazio, duplicata de escopo, ticket obsoleto, owner divergente, linha inválida ou conflito de período em qualquer conta impede toda publicação. Limites1000escopos/10000linhas recebidas no total. Falha em segunda conta não pode deixar primeira atualizada.

Compatibilidade da promoção de uma conta e overrides/regras/categorias preservada. Ausência não apaga movimento; cancelamento só com estado explícito. Nenhuma transação é prometida entre produtos, conexões ou meses distintos. Guard fresco no ponto de swap e ciclo de vida do MemoryScope continuam obrigatórios; esta fatia não implementa transporte/stager nem libera dados reais.

## EXP-12 — Lote de movimentos com manifesto de contas (T22b2)

Stager por conexão/mês DEVE capturar manifesto autorizado ordenado de1–100contas internas únicas, mais contexto/catálogos. Paginação global do produto é diferente da paginação da conta; cada conta, inclusive sem movimentos, precisa de página final explícita. Não saltar/reordenar contas nem terminar produto enquanto houver conta/página esperada. Envelope interno contém accountCursor, nextCursor global e pageDTO da conta; recibo local complete refere-se ao produto inteiro. windowComplete permanece independente do fim de cursor e orienta parcialidade.

Estágio somente após validação do coordenador, tickets/buffer privados por conta e callbacks de uso único. Mesma revisão/lease, ordem/cursor/ciclo,100páginas/10000linhas recebidas no produto; contagem antes de dedupe. Conflito entre páginas falha lote inteiro. Publicação por promoteBatches única após último cursor global/finalize, com guard no commit; cleanup invalida callbacks e aborta somente seus tickets sem apagar lote anterior. Ausência nunca deleta, cancelamento explícito atualiza, overrides sobrevivem. Manifesto vazio não simula cobertura: controller futuro deve tratar ausência conhecida de contas separadamente. Sem transporte real/endpoint ou novo acesso.

EXP-12: comprovação de transferência no manifesto multi-conta deve ser par (accountId,movementId), nunca movementId global isolado. Projetar somente IDs da conta atual ao contexto T22a; colisão de UUID em outra conta não amplia comprovação.

## EXP-13 — Identidade opaca estável de movimentos (T22c1)

O adapter backend DEVE derivar movementId interno por HMAC-SHA256 com chave independente de256bits, não exportável após importação no WebCrypto. Domínio fixo/versionado orbe:movement:v1, proprietário e conta interna autorizados e UUID do movimento no provedor compõem a mensagem com delimitadores inequívocos. Truncar128bits e marcar UUIDv8/variantRFC; isso é pseudonimização com122bits efetivos, não anonimização nem prova de autoria. O ID externo não vai ao DTO/cliente/log. Caller continua obrigado a resolver owner/sessão/binding/lease antes.

Chave só do backend, diferente de tokens Supabase/Pluggy/Expo, estável entre execuções; não configurar/gerar/publicar chave nesta fatia. Não rotacionar automaticamente: perda/rotação ou troca de conta interna requer migração/reconciliação explícita para preservar overrides; igualdade de valor/descrição não prova identidade. Conta interna preservada mantém ID mesmo com renovação do proxy, sem incluir connection/item na derivação.

Gates antes de conteúdo/contexto/chave/crypto; capturar escopo autorizado e obter/importar chave uma única vez por instância, compartilhada entre chamadas concorrentes. Fechamento invalida resultados assíncronos tardios; erros genéricos, sem IDs/chaves/exceções brutas. Não prometer zerar CryptoKey/heap nativo. Esta fatia não consulta provedor, não normaliza valores, não promove ledger e não habilita rota/flag financeira.

## EXP-14 — Janela mensal de movimentos em Brasília (T22c2)

O mês de apresentação DEVE ser America/Sao_Paulo e a data de origem Pluggy é instante UTC. Consulta por dias UTC deve cobrir do primeiro dia UTC do mês ao primeiro dia UTC do mês seguinte, inclusive; depois filtrar por mês local sem converter fim de paginação em cobertura completa. Para respeitar31dias inclusivos por chamada, mês de31dias usa duas janelas sem sobreposição:1–31 e dia1seguinte; demais meses usam uma. Não omitir as horas iniciais UTC do mês seguinte que ainda pertencem ao mês local anterior.

Planner puro desligado por padrão, sem tocar entrada/Intl quando gatesfalse, escopo de mês2000–2099 capturado. Classificador exige ISO UTC estrito/calendário válido, distingue fora de mês de data inválida e usa timezoneIANA (inclusive horário de verão histórico), não offsetfixo. Esta fatia não faz rede/paginação/projeção, não assegura cobertura bancária e não promove cache. Composição futura precisa concluir todas as janelas e revalidar sessão/lease antes de qualquer promoção.

## EXP-15 — Projeção mínima Pluggy de movimentos bancários (T22c3)

Projetar somente payload v2cursor de conta BANK autorizada, com JSON numérico exato, até500linhas. Contaexterna/item/owner/containterna/conexão/mês/janela vêm do resolver confiável, não do cliente. Cada linha exige UUID/contacorreta/dataUTC; filtrar mêsIANA somente dentro da janela autorizada. DEBIT/CREDIT determinam direção explicitamente; para BANK o sinal deve ser compatível, magnitude exata/segura em centavos ou null, somente BRL/USD/EUR nesta fatia. Não aplicar convenção de cartão a conta bancária; CREDIT/loans aguardam contrato próprio.

POSTED/PENDING permanecem explícitos; status desconhecido não simula cancelamento. Tipo financeiro unknown, categoria/reversalnull até evidência específica: débito/Pix não prova despesa/transferência própria, crédito não prova renda/estorno. Descrição literalNFC no máximo240unidadesUTF16 sem cortar caractere, recusar controles e omitir extras, categoria paga, balance, identity, merchant/paymentData/descriptionRaw. Identidade EXP-13; dedupe idêntico e conflito/collision invalidam página inteira.

Rawnext só é validado no backend com builder de host/janela/conta fixos; nunca retorná-lo ao cliente. DTO recebe exclusivamente nextCursor interno confiável (ASCIIopaco16–512), coerente com presença de next, cuja emissão/autenticação futura não é implementada aqui. windowComplete/sourceUpdatedAt vêm de evidência confiável e não são inferidos de cursor/vazio. Validar/copiar os campos antes de awaits, fechar identidade ao encerrar e descartar resultado após aborto. Falha genérica sem conteúdo; gates antes de qualquer leitura. Sem HTTP/runtime/deploy/secret ou cobertura real habilitada.

## EXP-16 — Orçamento de leitura de página transacional (T22c4)

Páginas v2 com até500movimentos podem exceder128KiB por campos extras. Permitir exclusivamente perfil transactions com teto1MiB no decoder numérico exato e leitorHTTP dedicado; manter defaultstandard e demais consumidores em128KiB. Perfil só enumeração fixa, sem limite arbitrário vindo de request. Ambos verificam bytesUTF8, profundidade64 e fonte numérica original; erro/aborto/overflow não vira lotevazio nem parseFloat/Number com perda. Inicializar decoder/probe de suporte antes de chamar o provedor na composição futura. Novo leitor exige decoder explícito; sua existência não autoriza consulta ou novo destino.

## EXP-17 — Cursor confidencial e vinculado ao lote (T22c6)

Cursor de movimentos DEVE usar AES-256-GCM/chave backend independente/IValeatório96bits/tag128bits, formato v1.base64url canônico e no máximo512caracteres. AAD vincula owner, sessãoAuthverificada, conexão/revisão, lease/expiração<=120s, mês e manifesto ordenado de1–100contas internas/externas/item. Chave só na ponte, não rotacionar outra credencial para derivá-la; não provisionar chave real nesta fatia. Importação nãoexportável única, erros genéricos/close descarta resultados tardios. Não afirmar zeramento deheap.

Payload cifrado contém índices de conta/janela e rawnext privado, validado antes de cifrar e depois de abrir pelo builder de origem/conta/filtros fixos. nextnull só representa início de janela/conta posterior, não término automático do produto. Queries grandes que não caibam no token512 falham fechadas, sem truncar/reconstruir cursor ou promover lote parcial. Nenhum ID externo/query fica legível no cursor/cliente/log; open é exclusivamentebackend e seu resultado nunca é DTOHTTP.

Checar relógio monotônico/TTL/aborto lógico antes e depois de operaçõesasync. Cursor autentica escopo, não substitui sessão/binding/lease/prova deprogressão; não é usoúnico global e pode ser reapresentado enquanto leaseválido. Transporte futuro deve revalidar cada página e concluir todascontas/janelas antes da promoção. Esta fatia não faz rede, persistência, configuração/env/deploy ou liberação financeira.

## EXP-18 — Manifesto bancário validado para movimentos (T22c7)

Antes de aplicar convençãoBANK a transações, o backend DEVE validar inventário de contas do item autorizado e mapear todos os IDs externos somente aos bindings internos confiáveis. Não tratar kindunknown persistido como BANK. Exigir página única completa, UUIDestrito, sem duplicatas/contas novas ou vínculos ausentes; preservação/descoberta é etapa própria. Parse compartilhado deve conservar o DTO público de inventário existente e manter tipo da fonte somente na projeção privada de manifesto.

Selecionar BANK com BRL/USD/EUR para esta fatia, ordenar por IDinternoASCII e limitar100contas, sem truncar. Excluir CREDIT e moeda não suportada com contagens explícitas/partial, sem consultar limites/saldos/nome/número/identidade. Manifesto não prova origemOF, capacidade ou cobertura; fonte e consentimento precisam ser validados pelo coordenador. Nenhum vínculo/capacidade é criado ou alterado. Gates antes de payload/contexto; resultado mínimo/congelado/erros genéricos.
