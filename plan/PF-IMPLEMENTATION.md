# Persistência PF no aparelho

Plano complementar ao [plano vigente Meu Pluggy](MEU-PLUGGY.md), derivado da [SPEC-008](../specs/008-personal-data/spec.md). Fonte financeira exclusiva: Open Finance. O plano local anterior foi retirado; consultar Git para histórico.

1. Validar runtime iOS, armazenamento criptografado, Keychain e Face ID com sintéticos.
2. Receber lotes autenticados da ponte, normalizar/reconciliar e promover atomicamente no aparelho.
3. Manter categorias/metas separadas da origem bancária, preservando correções após sincronização.
4. Testar bloqueio, perda de chave, journals, backup, reset e ausência de conteúdo em logs/CI/ferramentas.
5. Mostrar última data e produtos ausentes; conteúdo ausente não vira zero.

Não copiar ambientes ou recursos do Bolão F1. Uso real depende dos gates de fornecedor/runtime/segurança. A fonte automática permanece necessária para o aceite do produto.
