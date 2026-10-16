# Plano vigente para a primeira fatia PF — revisão 0.3

**Revisão vigente 0.4:** [SPEC-009](../specs/009-meu-pluggy/spec.md) seleciona Meu Pluggy para integração automática Bradesco/Mercado Pago PF. [Plano vigente](../plan/MEU-PLUGGY.md). Esta revisão prevalece sobre escolhas conflitantes abaixo; importação/local sem agregador é contingência, não caminho principal. Pesquisa pública permite seguir no planejamento, sem aprovação de dados reais.

Estado: planejamento, zero código. Governa a primeira fatia local; a arquitetura de servidor do plano 0.2 fica condicional. Entradas: [SPEC-008](../specs/008-personal-data/spec.md), SPEC-003/004/005/006/007 e [ADR-010](../docs/decisions/ADR-010-LOCAL-CORE.md).

## Componentes selecionados como candidatos

Expo/React Native/TypeScript para experiência iPhone, domínio monetário independente, repositório local, armazenamento SQLCipher e Keychain/biometria do iOS após spike. Não há versões/dependências instaladas. Revisar compatibilidade e componentes mantidos antes do bootstrap. Nenhuma implementação própria de algoritmo criptográfico.

Fluxo da primeira fatia: proprietário obtém arquivo pelo canal oficial do banco → seleciona localmente no iPhone → prévia/validação → importação atômica → banco local criptografado → classificação/relatórios no aparelho. O app não envia esse arquivo a servidor/parser/OCR/IA. Importação pode deixar cópia no provedor de arquivos: explicar origem/remoção e não prometer apagar cópias externas que o Orbe não controla.

## Sequência

1. Contrato PF/local e descoberta de formatos por documentação/layout sintético; não requisitar extrato do usuário para ferramentas.
2. Spike de build privado, persistência cifrada, chave/derivação de senha, Face ID/fallback, perda de chave e comportamento de backups iOS.
3. Implementação futura da base com fixtures sintéticas: acesso local, armazenamento, importadores, domínio e relatórios.
4. Verificação de saídas, bloqueio/captura, banco/journals/temporários, atualização e acesso físico no próprio ambiente sintético; conteúdo real só no gate.
5. Aceite privado pelo proprietário no aparelho. Ferramentas de criação/CI continuam sem acesso aos registros reais; evidência compartilhável é sintética ou metadado não financeiro.
6. Integração direta permanece desligada até ficha PF oficial e revisão da ponte/credenciais. Não transformar importação manual em alegação de Open Finance funcionando.

## Segurança e dados

Persistir os mesmos componentes canônicos de transações/posições/reservas, mas escopo de um proprietário local, sem endpoints de dados ou cadastro público por padrão. Não implementar RLS multiusuário como se fosse proteção de arquivo local. Imports são lotes com hash/identidade/cobertura de origem; deduplicação entre arquivos requer contrato por formato. Metas/overrides permanecem separados da fonte.

Banco fechado e referência de chave liberada quando bloquear; gestão real de memória em JavaScript tem limitações e precisa de revisão de módulo nativo. Medir o que é verificável, sem prometer limpeza perfeita de toda memória pelo GC. Recuperação de senha sem servidor não recupera magicamente uma chave perdida. Database, WAL/journal, temporários e backups devem ser examinados com dados sintéticos.

Sem outbound financeiro por padrão. Recursos visuais empacotados; relatórios calculados internamente. Consultas de biblioteca, atualização do app e distribuição são avaliadas separadamente, inclusive risco de código malicioso em update. Criptografia de disco não protege conteúdo quando o app foi autorizado a abri-lo e o aparelho está comprometido.

## Entregas que não serão confundidas

Base local funcional é uma entrega de gestão e relatórios. Conexão API PF homologada é outra entrega. Consolidação automática completa dos bancos/investimentos/cofrinhos somente será declarada quando todas as capacidades solicitadas tiverem prova; hoje essa prova não existe. Documentos não são demonstração funcional de nenhuma dessas entregas.
