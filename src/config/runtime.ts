// Published client remains synthetic; financial adapters require independent gates.
export const runtime = Object.freeze({
  rememberedLoginEnabled: true as const,
  ownerSetupEnabled: true as const,
  publicRegistrationEnabled: false as const,
  dataMode: 'synthetic' as const,
  metadataStatusEnabled: true as const,
  liveIntegrationEnabled: false as const,
  accountReadsEnabled: false as const,
  movementReadsEnabled: false as const,
  inventoryDiscoveryEnabled: false as const,
  privateFinancialDataApproved: false as const,
  biometricLoginEnabled: false as const,
});
