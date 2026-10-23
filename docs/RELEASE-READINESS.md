# Prontidão do Orbe — 23/10/2026

**Estado vigenteT79:** home grafite/violeta e estados porbanco/produto publicados; CI39987827224success/1252checks/types/export/audit1222fontes/56instâncias/scans/contraste. Backend21/metadata15/19migrations preservados. Titular confirmou valores apósT78; aceite visualT79 pendente. MPativo/investimentos sem posições recebidas; BradescoproxyOF603 validado/cadastradopending, falta Conexões→Preparar e ativar leitura na sessão titular. [Cobertura](BANK-COVERAGE.md), [QR](EXPO-PREVIEW.md). Cartões/faturas mapeados emSPEC011/planT80, ainda sem implementação. Nenhum dado financeiro real consultado por ferramentas.

O restante abaixo é histórico das etapas anteriores.


A liberação pessoal real foi instalada. Backend bridge18/metadata13 ativos, oito flags conferidas,18migrations imutáveis/hashverificadas. Nove rotas recusam anônimos401/no-store. A conexão Mercado Pago ainda precisa da ação Preparar e ativar leitura na sessão do titular; isso verifica inventário e consentimento antes de qualquer saldo. **Titular confirmou a leitura de saldos em23/10.** QR e publicação em [EXPO-PREVIEW](EXPO-PREVIEW.md).

| Entrega | Estado e limite |
|---|---|
| Login pessoal | Conta existente, refresh token rotativo no Keychain, senha não salva. Cadastro público/FaceID/recuperação desligados |
| Proteção | Retomada/captura/multitarefa confirmadas; coldrestart/logout/gravação/VoiceOver ficam na validação final |
| Mercado Pago | OrigemOF e permissões para contas/transações/investimentos verificadas por código com metadados reais; ativação pelo proprietário habilitada |
| Bradesco | Conectado no portal pessoal; proxy próprio ainda ausente no inventário desta aplicação. Não concluído |
| Contas | Descoberta/ativação/lease/centavos/transporte/cache/tela disponíveis para conexão validada |
| Movimentações | Leitura mensal paginada, identidade opaca, cache volátil e progressoSQL; cobertura real a confirmar no iPhone |
| Investimentos | Até1000posições/10páginas, bruto/líquido/data, cache volátil; cobertura real a confirmar no iPhone |
| Cofrinhos | Sem vínculo/natureza comprovados pela fonte; não inferir nem duplicar valores |
| Relatórios e categorias | Demonstração separada dos dados reais; ligação ao cache financeiro ainda pendente |
| Infraestrutura |18migrations verificadas; fixtureSQL instalada comrollback/zeroresíduos/ownerpreservado; banco próprio guarda somente metadados |

## Evidências

CI39684158931 passou com implementação completa:1083Node+146Python=1229verificações, tiposcliente/backend, exportiOS/Hermes. Correção administrativa adicional aprovada em [CI39684619830](https://github.com/yurilopesmdv/orbe-finance/actions/runs/39684619830),1231verificações totais (1083Node+148Python). Auditoria recémexportada1219fontes/56instâncias, advisoriesausentesJS; sourcemaps privados. Scans de perfisprivados/allowlist46 aprovados. Validador real confirmou cadeia proxy→consentimento→original606/OpenFinance/não sandbox/atualizado; nenhuma ferramenta consultou valores.

Liberação após a instrução expressa do titular em21/10, com política delimitada em [OWNER-RELEASE](security/OWNER-RELEASE-20261021.md). Substitui os bloqueios documentais anteriores exclusivamente sintéticos; não equivale a certificação do fornecedor nem riscozero. Advisories do tooling continuam registrados e mitigados pelo fluxo de publicação restrito, sem dados reais naCLI/assinaturacustomizada/Metroreal. Nenhuma dependência foi silenciosamente considerada corrigida.

O erro de interpretação da resposta vazia de sucesso de POSTsecrets foi corrigido e testado; as tentativas anteriores voltaram paraflagsfalse. A liberação final foi confirmada por digests/fontes/versões, não presumida pelo POST. `financial-release.py disable` permite desligar; pausa no app e remoção não revogam consentimento no banco.

## Restante

Ativação e primeirovalor via sessão do titular, compartilhamento do Bradesco com esta aplicação, homologação privada por produto, classificação/relatórios reais e cofrinhos conforme evidência. Nenhum desses itens está sendo tratado como concluído. Não pedir imagens/valores financeiros no chat; testes físicos finais agrupados. Sem novas configurações de credenciais exigidas para o Mercado Pago.


## Correção23/10

Ativações anteriores chegaram90s/44s antes da preparação concluída; não foi falha de credenciais. Ação única agora prepara antes de verificar/ativar, com cancelamento e comprovação SQL preservados. CI39949557277success/1236verificações, tipos/exportHermes/auditoria1217fontes/56instâncias/scans aprovados. Nova publicação e QR em EXPO-PREVIEW; primeirostatusativo/saldo no iPhone ainda não confirmado. Backend15/metadata11/18migrations preservados,9smokesanônimos401/no-store revalidados.


## Correção da primeira leitura (T76f)

Datas PostgreSQL com offset/microsegundos agora são normalizadas em contas e origem de investimentos. CI39966769243success/1240verificações, tiposcliente/backend e scans aprovados. Bridge18/metadata13 com fontes/digests conferidos,18migrations preservadas,8flags ativas e9smokesanônimos401/no-store. Uma lease expirada da falha foi encerrada comoutcomefailed e o intervalo residual removido apenas desse caso. Nenhumvalor/consentimento/sessão foi alterado. App/QR23/10 mantidos, sem novoEAS. Primeiro saldo real ainda não confirmado; diagnóstico no guiaACTIVATION-TROUBLESHOOTING.


Confirmação23/10/T76g: saldo funcionando pelo titular apósbackend18. Movimentações ainda não iniciadas porque a leitura decontas consumiu o intervalo compartilhado de15min porconexão; mensagem de cooldown confirmada pelo titular. Não há evidência de erro do endpoint financeiro Pluggy nesta tentativa; não consultar extrato pelas ferramentas nem remover intervalo de leitura bem-sucedida.
