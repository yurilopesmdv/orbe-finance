# Alcance das pendências de ferramentas — revisão 21/10/2026

c42/SEC-23/MPG-06. Revisão estática de fonte instalada e advisories públicos, sem executar exploit, certificado externo, sessão bancária ou publicação adicional. A data no nome preserva a sequência documental iniciada em20/10.

## Achados

| Pacote | Evidência | Conclusão limitada |
|---|---|---|
| braces3.0.3 | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) ainda informa ausência de versão corrigida e esgotamento de pilha por padrões aninhados. micromatch importa braces e o chama em parse/braces/braceExpand | Há dependência real nas ferramentas, mas carregar módulo não prova execução vulnerável. O watcher Metro examinado chama micromatch.some; não foi feita prova global de inatingibilidade de todas as operações da árvore |
| node-forge1.4.0 | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) ainda sem patch, sobre verificação RSA PKCS#1v1.5. @expo/code-signing-certificates chama certificate.verify e publicKey.verify; a CLI Expo importa essa biblioteca para certificados/assinaturas | O caminho de assinatura existe no tooling. app.json atual não configura certificado/codeSigningMetadata e o wrapper não passa private-key-path; isso reduz o fluxo usado, sem certificar toda a CLI/EAS ou aceitação de material remoto |
| Aplicativo/ponte | Grafo JS auditado1205fontes/56instâncias sem essas raízes; bridge usa módulos próprios/HTTP e decoder exato | Ausência no JS não cobre binário Go, ferramentas de distribuição ou serviço do fornecedor |

O wrapper de exportação recebe ambiente público restrito, sem tokens, e usa comando/plataforma fixos; a publicação consome dist já exportado, sem bundler, com canários privados e CLI fixada25.2.0. Essas medidas são verificáveis no código do projeto, mas não eliminam automaticamente os advisories. Não processar padrões/certificados fornecidos por fontes desconhecidas, não expor Metro e não adicionar code signing por conveniência. O projeto utiliza preview remoto; não é necessário servidor LAN.

## Resultado

Não surgiu patch oficial a aplicar. Nenhum downgrade, patch local de dependência, supressão de advisory, alteração de lock ou extensão de exceção foi feito. A exceção existente permanece somente sintética até23/10/2026; a liberação financeira não foi aprovada por este relatório. Mitigação integral exige prova adicional do alcance ou atualização upstream compatível e revalidação. Adicionar outra suite de fixtures não substitui essa evidência.

977testes/typechecks/CI39518966284 já aprovados na c41; não repetidos por esta revisão documental. Nenhuma chamada financeira ou acesso ao conteúdo do aparelho. Próxima frente funcional independente: contrato do adapter de movimentos reais (T22c), começando pela identidade interna estável e sem expor IDs do provedor; todas as rotas permanecem desligadas até os gates.

## Hashes das fontes locais examinadas

| Fonte | SHA256 |
|---|---|
| `node_modules/braces/lib/compile.js` | `dc98f22eee3d511785d92a00758d5f0d48efed5f5813bdecc2de430c529b5c9f` |
| `node_modules/braces/lib/expand.js` | `41ccc196ebfa7b7781a634e721eb744e4e7bcb54cba427a7e3d6806a1b9e58f7` |
| `node_modules/micromatch/index.js` | `6a56366fcf3ae8e678e574900a0acb2ea6f118ea030d09bcc1b1053ccab916bb` |
| `node_modules/metro-file-map/src/watchers/common.js` | `fd54d0713d2066eb474652dcdf3f88ff67f66d84600d1d8013ecbf6c7fdc3c47` |
| `node_modules/@expo/code-signing-certificates/build/main.js` | `3670cfbd69934b475257649886517d0314890ca4139708d2c812efaab04bc6d1` |
| `node_modules/@expo/cli/build/src/utils/codesigning.js` | `935fadac6f1dc56bc088acb04416d1fc83bd70505f368b87dd210d0aa4617de2` |

Hashes não certificam toda a árvore nem substituem correção upstream. Histórico e política em [DEPENDENCIES](DEPENDENCIES.md).
