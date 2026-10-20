// This bootstrap has no live adapter, credential or financial persistence.
export const runtime = Object.freeze({
  dataMode: 'synthetic' as const,
  metadataStatusEnabled: true as const,
  liveIntegrationEnabled: false as const,
  biometricLoginEnabled: false as const,
});
