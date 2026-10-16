# Investigação: APIs diretas de contas PF

Data: 16/10/2026. Contas PF confirmadas pelo usuário. Prioridade reduzida a Bradesco e Mercado Pago. Consulta somente pública, sem credenciais ou chamadas a contas reais. Pergunta: existe rota direta, gratuita e completa que evite agregador e atenda ao objetivo financeiro?

## Resultado por instituição

| Instituição | Confirmado nas fontes | Não confirmado | Consequência |
|---|---|---|---|
| Bradesco | [Portal Open APIs](https://api.bradesco/openapis) anuncia saldo/extrato, seleção de plano e credenciais com certificado | Elegibilidade de PF para esse produto, preço de produção, scopes e posição de investimentos | Não assumir habilitação gratuita; precisa condição formal do produto aplicável à conta PF |
| Mercado Pago | [Relatório Dinheiro em conta](https://www.mercadopago.com.br/developers/pt/docs/reports/account-money/introduction) e [geração por API](https://www.mercadopago.com.br/developers/pt/docs/reports/account-money/api) documentam movimentos/relatórios | Extrato pessoal integral, todos os gastos, cofrinhos nominados, investimentos e credencial realmente restrita a leitura | Não confundir API de conciliação com API universal da carteira pessoal |

Não encontrar documentação pública suficiente não prova inexistência de acesso privado/contratado. Da mesma forma, ter portal de API ou conta pessoal não prova direito de consultar todos os recursos. Não foi criado cadastro de desenvolvedor nem solicitado certificado.

A [referência de autenticação do Mercado Pago](https://www.mercadopago.com.br/developers/pt/reference) orienta manter chave privada no servidor, não no cliente. Portanto não colocar token pessoal no Expo Go para evitar um backend. A capacidade de chamar GET/relatórios não implica que o token esteja impedido de pagamentos ou outras operações. Um backend/ponte só será discutido se houver ganho comprovado e privilégio adequado; não criá-lo por suposição.

## Escolha vigente

Meu Pluggy é o caminho selecionado; fonte financeira exclusiva Open Finance, com conector bancário e cobertura ainda sujeitos a comprovação. APIs diretas não são trilha de implementação atual. [Pesquisa de segurança](../security/MEU-PLUGGY-REVIEW.md) e [plano](../../plan/MEU-PLUGGY.md).

## Runtime e custo

[Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) documenta que SQLCipher exige build próprio e não funciona no Expo Go. [Face ID](https://docs.expo.dev/versions/latest/sdk/local-authentication/) também precisa de build compatível. Consequência de projeto: Expo Go para sintéticos; conteúdo real somente depois de preparar distribuição privada e validar controles. O armazenamento local protegido não deve ser substituído por SQLite em claro só para manter o runtime.

A [Apple](https://developer.apple.com/programs/enroll/) descreve condições de adesão ao Developer Program. Não houve adesão ou cobrança; custo/forma de instalação privada ainda precisam ser escolhidos. API sem mensalidade, zero assinatura de agregador e distribuição iOS sem custo são afirmações diferentes. Preferência gratuita não autoriza contratar nada.

## Limites importantes

Não é possível garantir ausência de vazamento por toda via possível: aparelho comprometido, teclado/OS, câmera externa, cadeia de atualização e erro humano continuam riscos. A proposta reduz fluxos e cópias; testes devem comprovar os controles observáveis. Sem nuvem de finanças, relatórios continuam profundos e determinísticos no aparelho, mas não há recuperação remota automática. Não pedir conteúdo financeiro real nas ferramentas.
