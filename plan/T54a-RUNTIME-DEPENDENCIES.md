# T54a — alcance das dependências no export iOS

20/10/2026; SEC-11/17/23. Integrador único; depende T07/T44/lockfile/isolamentoExpo. Escopo: scripts/expo-environment.mjs/expo-safe.mjs, scripts/runtime-audit.mjs/runtime-audit-policy.mjs, tests/security, workflow check, package scripts e documentos.

Exportar JS iOS production com sourcemap externo/sem Hermes somente em ~/.config/orbe-finance/runtime-audit0700; nenhum segredo/token no processo, sem servidor local e sem upload. Operação separada export-audit aceita zero argumentos livres. Publicação normal continua usando dist Hermes sem mapas. Política recusa mapa inválido/excessivo, arquivo privado ou raiz vulnerável em sources. Reportar packages/versões do lock e SHA256 do JS/map, sem publicar sourcesContent ou caminhos locais.

Aceite: testes de mapa regular/indexado, root transitiva, mapeamento privado e schema inválido; export instalado real, relatório com contagens/hashes e duas raízes ausentes ou tarefa falha. Typecheck/suíte/CI. Não concluir T54 inteira: os alerts continuam nas ferramentas, sem patch nas fontes consultadas em20/10. Não alterar validade/exceção sintética para esconder advisories. Não prova binário nativo ou EAS cache.

Fontes primárias20/10: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm e https://github.com/advisories/GHSA-86w9-cpqp-85rv ainda sem patch; flags verificadas no CLI Expo57 instalado. Próximo T65a avaliação Expo Go sem custo e modo volátil/senha, conforme preferência do titular. Gates de dados reais permanecem fechados durante a avaliação.

Concluída:664 testes/typechecks; export privado real com1162 fontes/53 pacotes e duas raízes ausentes do JS. Três nomes virtuais NUL conhecidos do Metro tratados explicitamente, demais NUL negados. Nenhum mapa enviado ao Git/Expo/artifacts. T54 inteira não concluída.
