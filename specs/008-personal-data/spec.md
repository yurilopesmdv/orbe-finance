# SPEC-008 — Contas PF e núcleo financeiro local

**Revisão vigente 0.4:** [SPEC-009](../../specs/009-meu-pluggy/spec.md) seleciona Meu Pluggy para integração automática Bradesco/Mercado Pago PF. [Plano vigente](../../plan/MEU-PLUGGY.md). Esta revisão prevalece sobre escolhas conflitantes abaixo; importação/local sem agregador é contingência, não caminho principal. Pesquisa pública permite seguir no planejamento, sem aprovação de dados reais.

Estado: draft, revisão 0.3 de 16/10/2026. Usuário confirmou que todas as contas são PF e delegou a escolha do caminho técnico, subordinada à privacidade. Escopo prioritário de investigação: Bradesco e Mercado Pago. Inter e Nubank deixam a primeira fatia; não foram homologados nem removidos de alguma integração existente, pois não há app implementado.

## Decisão de arquitetura e limite de entrega

Adotar núcleo local: armazenamento protegido, categorização e relatórios no iPhone. A opção sem backend/agregador abaixo é histórica; a automação vigente requer a ponte definida na SPEC-009. Integração automática continua parte do objetivo original, mas não está comprovada por APIs diretas PF; não declarar objetivo integral entregue apenas por fazer um app offline. Importação local é uma capacidade útil e contingência explícita, não Open Finance automático disfarçado.

Esta spec complementa e prevalece sobre escolhas anteriores de arquitetura gerenciada, não apaga as regras de domínio/privacidade. As propostas de Auth por e-mail, RLS multiusuário, workers e filas na nuvem das SPEC-001/002 e plano 0.2 ficam suspensas para a primeira fatia, não devem ser implementadas por padrão. Se uma ponte de API for viável, seus requisitos de autorização/segredos continuam obrigatórios e serão especificados antes de implementação. Segurança e relatórios das SPEC-006/007 permanecem aplicáveis.

| ID | Requisito |
|---|---|
| PF-01 | DEVE tratar Bradesco e Mercado Pago como PF confirmadas, com acesso/custo/capacidades de API registrados separadamente; ausência de prova não significa endpoint inexistente |
| PF-02 | DEVE manter carteira, transações, classificação e relatórios no aparelho por padrão, sem enviar conteúdo a IA, BI, analytics ou ferramentas de criação; sincronização com Pluggy/ponte é permitida somente nos limites da SPEC-009 |
| PF-03 | DEVE usar armazenamento criptografado com componentes mantidos, gestão de chave e senha local avaliadas; não implementar criptografia caseira nem prometer proteção com bloqueio visual apenas |
| PF-04 | DEVE planejar senha local e Face ID nativo opcional, sem cadastro de rosto; sessão remota da ponte definida na SPEC-009; decisão de perda de senha/chave e reinstalação deve ser explícita |
| PF-05 | DEVE permitir entrada manual/importação local somente de formatos oficiais confirmados, com prévia, validação e deduplicação; não usar scraping, automação de internet banking ou API interna reversa |
| PF-06 | DEVE preservar fontes, datas, parcialidade e reconciliação dos investimentos/cofrinhos mesmo quando um formato não trouxer esses produtos; atualização manual não simula sincronização automática |
| PF-07 | DEVE manter integração direta desligada até provar elegibilidade PF, custo, scopes efetivos, revogação e cobertura; nunca embutir Access Token/certificado privilegiado no app |
| PF-08 | DEVE distinguir uso sintético no Expo Go do ambiente real privado, com controles locais/de captura/publicação validados antes de conteúdo real |

## Autenticação e chaves propostas

App de um proprietário, sem cadastro público, e-mail, SMTP ou recuperação remota por padrão. A senha protege o desbloqueio local; a técnica de derivação/proteção da chave precisa passar revisão antes do código de uso real. Opt-in biométrico só depois de primeiro desbloqueio por senha e runtime compatível; acesso ao rosto continua no iOS. Não guardar senha em texto nem usar chave fixa no bundle. SQLCipher e Keychain são candidatos de implementação nativa, não controles já instalados.

Sem recuperação externa, perda da chave pode exigir apagar/reimportar dados, perdendo classificação/metas locais. Sem backup no MVP, perda do aparelho também implica perda dessa organização local. Não ativar backup/exportação em nuvem para resolver isso silenciosamente; eventual cópia criptografada precisa de outra spec, controle de destino e restauração. A disponibilidade dos dados é um tradeoff de confidencialidade que deve ser visível.

## Entrada de dados e relatórios

Importar apenas arquivos cujo formato o banco efetivamente ofereça para PF. CSV/OFX são candidatos, não promessa de que os dois bancos exportam ambos; PDF fica fora da primeira fatia por ambiguidade e risco de parser/OCR externo. Provar layout com fixture inteiramente sintética antes de importar no aparelho do titular. Tratar arquivo como entrada não confiável: limitar tamanho/encoding/linhas, rejeitar inválidos, não executar fórmula/HTML/URL, impedir duplicação e mostrar intervalo/cobertura. Arquivo original em Files/iCloud pertence a outro limite de armazenamento; o Orbe não controla suas cópias anteriores.

Conta/investimento/reserva não presente recebe ausência explícita e pode ter posição manual datada; nunca inventar atualização diária. Mesmos cálculos de centavos, transferência, estorno e sobreposição se aplicam. Relatórios permanecem locais, com resumo → gráfico/lista → itens que explicam o total.

## Aceite futuro

- AC-F01: com rede indisponível, app privado desbloqueia localmente e usa apenas dados já importados, sem solicitar Auth cloud.
- AC-F02: tentativa de abrir banco com chave inválida falha; arquivos temporários/journals e logs sintéticos não expõem registros.
- AC-F03: repetir o mesmo arquivo/lote não duplica; arquivo inválido não promove importação parcial como completa.
- AC-F04: reserva ausente ou posição manual identifica origem/data e parcialidade, sem rótulo enganoso de sincronização.
- AC-F05: captura de rede dos fluxos sintéticos de importação/relatório não mostra envio de conteúdo; controles e limites de inspeção são registrados.
- AC-F06: conexão automática continua indisponível sem ficha de elegibilidade e autorização; só consultar endpoints não prova que a credencial é read-only.
- AC-F07: sem modo de recuperação aprovado, esqueci a senha informa consequências antes de apagar/recriar; não restaura silenciosamente conteúdo antigo.

Nada desta revisão autoriza código, instalação, recurso pago ou conexão bancária durante R0. A permissão para decidir caminho não comprova risco zero e não substitui evidência de segurança.
