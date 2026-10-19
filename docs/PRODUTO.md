# Produto disponível — Orbe Finance

Aplicativo pessoal para iPhone/Expo Go SDK57, ainda em demonstração financeira. A tela inicial separa Entrar no Orbe (quando configurado) de Explorar demonstração. Login por senha valida o proprietário no backend próprio e mantém sessão volátil, bloqueada ao sair para segundo plano. Não há Face ID no Expo Go nem recuperação por email habilitada sem SMTP homologado.

Quatro abas: Resumo, Movimentações, Carteira e Ajustes. Exemplos inventados permitem consultar gastos por período/banco/categoria/tipo, corrigir classificações na sessão e ver carteira sem contar reservas em dobro. Resumo dá acesso aos relatórios com detalhe por categoria; Carteira permite criar metas e alocações demonstrativas sem movimentar dinheiro. Ocultação de valores é compartilhada e volta ao segundo plano.

Ajustes → Conexões explica instituições prioritárias Bradesco/Mercado Pago PF, produtos ainda não homologados, funcionamento previsto do Meu Pluggy/Open Finance e diferenças entre pausa/desvínculo/revogação. A tela não solicita identificador externo, CPF ou credencial, não abre links bancários e não conecta instituições. Inter/Nubank ficam para expansão. Não existe botão de conectar enquanto integração/gates permanecem pendentes.

Auth real e dados financeiros sintéticos são coisas separadas: entrar não conecta banco nem transforma exemplos em dados pessoais. Nenhuma cobertura de contas, investimentos ou cofrinhos foi homologada. Ponte/status têm núcleo e adapters testados localmente, e há apenas uma função de desenvolvimento publicada que sempre responde indisponível, sem acessar dados. Backend persiste apenas Auth/metadados, sem valores financeiros. Privacidade, runtime e cobertura devem ser aprovados antes de conexão real.

T33a foi validada com TypeScript do cliente/ponte,272 testes vigentes e exportação iOS. Não foram criados testes que apenas repetem textos JSX. Testes físicos, acessibilidade/VoiceOver e fluxos no iPhone permanecem na validação final, conforme solicitado.
