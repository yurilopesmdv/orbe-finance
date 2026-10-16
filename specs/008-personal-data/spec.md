# SPEC-008 — Contas PF e persistência no aparelho

Estado: ready para R1 sintética; dados reais continuam bloqueados, revisão 0.5 de 16/10/2026. Bradesco e Mercado Pago PF prioritários; Inter/Nubank em expansão. Fonte financeira exclusiva: Open Finance via Meu Pluggy, conforme SPEC-009. Não haverá alimentação por arquivos nem cadastro de saldos/transações.

| ID | Requisito |
|---|---|
| PF-01 | DEVE registrar capacidades/custo/acesso separadamente para Bradesco e Mercado Pago PF, sem presumir cobertura por banco/produto |
| PF-02 | DEVE manter classificação e relatórios no aparelho por padrão; processamento pela Pluggy/ponte somente nos limites da SPEC-009, sem IA, BI, analytics ou ferramentas de criação |
| PF-03 | DEVE usar armazenamento criptografado com componentes mantidos e gestão de chave avaliada; não implementar criptografia caseira nem confundir bloqueio visual com proteção do banco |
| PF-04 | DEVE planejar senha e desbloqueio local com Face ID nativo opcional, sem cadastro de rosto; sessão remota da ponte é um controle distinto e recuperação deve ser explícita |
| PF-06 | DEVE preservar origem, datas, parcialidade e reconciliação de investimentos/cofrinhos; produto não retornado permanece indisponível, sem estimativa ou preenchimento substituto |
| PF-07 | DEVE manter acesso real desligado até comprovar conector Open Finance, elegibilidade PF, custo, scopes, revogação e cobertura; nenhum token privilegiado no app |
| PF-08 | DEVE distinguir uso sintético no Expo Go do ambiente real privado, com armazenamento, captura e publicação validados antes de conteúdo real |

PF-05 retirado do escopo em 16/10/2026; ID reservado, sem reutilização. Correções de categorias/metas continuam permitidas: não são nova origem de saldos ou movimentos.

## Aceite futuro

- Offline: somente dados anteriormente sincronizados e desbloqueados no aparelho, com data explícita.
- Chave inválida não abre banco; journals/temporários/logs sintéticos não expõem registros.
- Repetir lote da API não duplica; falha de paginação não promove lote parcial como completo.
- Reserva ausente não recebe valor inventado nem rótulo de sincronização bem-sucedida.
- Relatórios não enviam conteúdo financeiro para novos destinatários.
- Perda de chave/reinstalação informa perda da organização local antes de reset; sincronizar novamente depende de sessão e consentimento válidos.

SQLCipher e Face ID exigem validação de runtime; Expo Go não é aprovado para dados reais por compilar. Não ativar backup/exportação em nuvem silenciosamente. Proteger o aparelho não elimina o processamento necessário no fornecedor/ponte.
