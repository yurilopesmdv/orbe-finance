# T05 — Wireframes de cinco fluxos

Estado: done como wireframe local, sem homologação física. Requisitos UX-01/04 e SPEC-007. Arquivo docs/design/wireframes.html: cinco telas selecionáveis, estados parcial/atualizado/vazio/erro/bloqueado/carregando/sem conexão/desatualizado, ocultação de valores e período mantido ao navegar. Login é estado bloqueado ilustrativo, campos desabilitados; não recebe credenciais.

Visão geral → Relatórios → Alimentação → movimentos: duas ações preservam mês. Carteira explica cofrinhos já incluídos e dados ausentes. Conexões mostra Bradesco/MP não homologados. Quatro abas principais; relatórios dentro do resumo e Conexões em Ajustes. Paleta neutra/verde, fontes locais, foco de teclado, botões mínimos 44px e valores ocultos também no texto acessível. Wireframe não substitui testes VoiceOver/dynamic type/safe area no iPhone.

Nenhum recurso remoto, fetch, form submit, fonte externa ou biblioteca. CSP bloqueia rede e envio de formulário. Dados, datas e valores inteiramente inventados. JS trata somente seletores locais, sem arquivos, URLs ou conteúdo externo. Controles de conexão/Face ID não fingem sucesso. HTML serve para revisão da estrutura, não é app Expo nem login funcional.

Validação: sintaxe JS com Node --check, inspeção do HTML e ausência de referências remotas. Sem navegador automatizado instalado nesta task; não declarar screenshot/render ou teste físico executados. Próxima etapa sequencial: T47, diligência de destinatários para escopo sintético, preservando bloqueio real.
