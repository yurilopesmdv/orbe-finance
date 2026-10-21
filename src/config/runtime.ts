// Demo tabs remain synthetic. Private banking screens require the authenticated owner.
export const runtime = Object.freeze({
  rememberedLoginEnabled: true as const,
  ownerSetupEnabled: true as const,
  publicRegistrationEnabled: false as const,
  dataMode: 'synthetic' as const,
  metadataStatusEnabled: true as const,
  liveIntegrationEnabled: true as const,
  connectionActivationEnabled: true as const,
  accountReadsEnabled: true as const,
  investmentReadsEnabled: true as const,
  movementReadsEnabled: true as const,
  inventoryDiscoveryEnabled: true as const,
  privateFinancialDataApproved: true as const,
  biometricLoginEnabled: false as const,
});
