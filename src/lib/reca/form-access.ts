export interface RecaFormAccessInput {
  hasSubscription: boolean;
  hasPaidAccess: boolean;
  isPortalOwner: boolean;
}

export interface RecaFormAccessState {
  canAccessForms: boolean;
  needsPayment: boolean;
  needsToSelectTier: boolean;
}

export function resolveRecaFormAccess(
  input: RecaFormAccessInput
): RecaFormAccessState {
  const canAccessForms = input.hasPaidAccess || input.isPortalOwner;

  return {
    canAccessForms,
    needsPayment: input.hasSubscription && !canAccessForms,
    needsToSelectTier: !input.hasSubscription && !input.isPortalOwner,
  };
}
