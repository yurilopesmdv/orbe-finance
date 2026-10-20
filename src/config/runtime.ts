// This bootstrap has no live adapter, credential or financial persistence.
export const runtime = Object.freeze({
  rememberedLoginEnabled: true as const,
  ownerSetupEnabled: true as const,
  publicRegistrationEnabled: false as const,
  dataMode: 'synthetic' as const,
  metadataStatusEnabled: true as const,
  liveIntegrationEnabled: false as const,
  biometricLoginEnabled: false as const,
});
