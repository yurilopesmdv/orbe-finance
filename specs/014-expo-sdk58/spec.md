# SPEC-014 — Expo Go SDK 58

Autorizado pelo titular em 25/10/2026: migrar também o Orbe Finance para o Expo Go SDK 58 já instalado.

- Atualizar Expo/React/React Native e módulos pela matriz oficial SDK 58, mantendo scheme `orbe`, projeto EAS próprio e canal preview.
- Preservar login protegido, bloqueio/captura/multitarefa, cache AES local, carteira automática e classificações. Sem leitura financeira pelas ferramentas, alteração de banco, migração, credencial ou fornecedor.
- Migrar as guardas de publicação/recibo para runtime 58, mantendo hashes exatos e rejeição de runtime antigo. Não desabilitar scan, auditoria de runtime nem validação de fontes.
- Validar tipos cliente/backend, fixtures, APIs nativas usadas (crypto, secure-store, file-system, screen-capture, fetch e WebView), export iOS/Hermes, dependências, scan e CI. Commit/push antes de publicação; conferir manifesto/hash/scheme/QR oficial e entregar novo QR.
- Confirmação física continua com o titular; não usar sessão ou dados financeiros pessoais para testar.
