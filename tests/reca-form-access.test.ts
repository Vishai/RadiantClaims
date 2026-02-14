import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRecaFormAccess } from "../src/lib/reca/form-access";

describe("resolveRecaFormAccess", () => {
  it("allows portal owners without subscriptions", () => {
    const result = resolveRecaFormAccess({
      hasSubscription: false,
      hasPaidAccess: false,
      isPortalOwner: true,
    });

    assert.equal(result.canAccessForms, true);
    assert.equal(result.needsPayment, false);
    assert.equal(result.needsToSelectTier, false);
  });

  it("requires tier selection for non-portal users without subscriptions", () => {
    const result = resolveRecaFormAccess({
      hasSubscription: false,
      hasPaidAccess: false,
      isPortalOwner: false,
    });

    assert.equal(result.canAccessForms, false);
    assert.equal(result.needsPayment, false);
    assert.equal(result.needsToSelectTier, true);
  });

  it("requires payment when subscription exists but is unpaid", () => {
    const result = resolveRecaFormAccess({
      hasSubscription: true,
      hasPaidAccess: false,
      isPortalOwner: false,
    });

    assert.equal(result.canAccessForms, false);
    assert.equal(result.needsPayment, true);
    assert.equal(result.needsToSelectTier, false);
  });
});
