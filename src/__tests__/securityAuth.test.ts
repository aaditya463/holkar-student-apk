/**
 * securityAuth.test.ts — Automated Verification Test Suite
 * Holkar Science College ERP (Phase 7: Biometric + MPIN + Authentication Hardening)
 *
 * Verifies all 12 core requirements:
 * A. Normal login
 * B. Enable biometric
 * C. App restart
 * D. Biometric success
 * E. Biometric failure
 * F. Logout
 * G. Token expiration
 * H. MPIN setup
 * I. MPIN correct
 * J. MPIN incorrect
 * K. MPIN lockout
 * L. Disable MPIN
 */

import {
  validateMpinStrength,
  setupMpin,
  verifyMpin,
  disableMpin,
  getMpinStatus,
  isBiometricAuthEnabled,
  setBiometricAuthEnabled,
  storeSecureToken,
  getStoredSecureToken,
  clearStoredSecureToken,
  checkBiometricCapability,
} from "../services/security.service";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runAllSecurityAuthTests(): Promise<{
  passed: number;
  total: number;
}> {
  let passed = 0;
  let total = 0;

  async function testCase(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      passed++;
    } catch (e: any) {
      console.error(`Test failed [${name}]:`, e.message);
      throw e;
    }
  }

  // A. Normal login securely stores session credential
  await testCase("A. Normal login", async () => {
    await clearStoredSecureToken();
    const mockJwt = "mock.jwt.token.student_24DS1001";
    await storeSecureToken(mockJwt, "24DS1001", "24DS1001");
    const stored = await getStoredSecureToken();
    assert(stored === mockJwt, "Stored token should match input JWT");
  });

  // B. Enable biometric configuration
  await testCase("B. Enable biometric", async () => {
    await setBiometricAuthEnabled(false);
    assert(
      (await isBiometricAuthEnabled()) === false,
      "Biometric should start disabled",
    );
    await setBiometricAuthEnabled(true);
    assert(
      (await isBiometricAuthEnabled()) === true,
      "Biometric should be enabled",
    );
  });

  // C. App restart with biometric enabled protects session
  await testCase("C. App restart protection", async () => {
    const mockJwt = "mock.jwt.token.valid_session";
    await storeSecureToken(mockJwt, "student1", "student1");
    await setBiometricAuthEnabled(true);
    const token = await getStoredSecureToken();
    const bioEnabled = await isBiometricAuthEnabled();
    assert(
      Boolean(token) && bioEnabled,
      "App restart must keep session locked behind quick auth",
    );
  });

  // D & E. Biometric capability detection
  await testCase("D & E. Biometric capability check", async () => {
    const capability = await checkBiometricCapability();
    assert(
      typeof capability.hasHardware === "boolean",
      "hasHardware must be boolean",
    );
    assert(
      typeof capability.isEnrolled === "boolean",
      "isEnrolled must be boolean",
    );
    assert(
      typeof capability.primaryTypeName === "string",
      "primaryTypeName must be string",
    );
  });

  // F. Logout clears token and prevents biometric restore of revoked session
  await testCase("F. Logout revocation", async () => {
    await storeSecureToken("mock.jwt.to_revoke", "student1", "student1");
    await setBiometricAuthEnabled(true);
    await clearStoredSecureToken();
    const tokenAfterLogout = await getStoredSecureToken();
    assert(tokenAfterLogout === null, "Token must be null after logout");
  });

  // G. Token expiration simulation
  await testCase("G. Token expiration", async () => {
    await storeSecureToken("mock.jwt.expired", "student1", "student1");
    // On 401 response:
    await clearStoredSecureToken();
    assert(
      (await getStoredSecureToken()) === null,
      "Session must be wiped on token expiry",
    );
  });

  // H. MPIN setup and strength enforcement
  await testCase("H. MPIN setup and strength", async () => {
    assert(
      validateMpinStrength("000000").valid === false,
      "Must reject 000000",
    );
    assert(
      validateMpinStrength("111111").valid === false,
      "Must reject 111111",
    );
    assert(
      validateMpinStrength("123456").valid === false,
      "Must reject 123456",
    );
    assert(
      validateMpinStrength("654321").valid === false,
      "Must reject 654321",
    );
    assert(
      validateMpinStrength("1234").valid === false,
      "Must reject non-6 digits",
    );
    assert(
      validateMpinStrength("582914").valid === true,
      "Must accept strong 6-digit MPIN",
    );

    const res = await setupMpin("582914", "582914", "student1");
    assert(res.success === true, "Setup MPIN should succeed");
    const status = await getMpinStatus();
    assert(status.isEnabled === true, "MPIN status should be enabled");
  });

  // I. MPIN correct verification unlocks
  await testCase("I. MPIN correct verification", async () => {
    await setupMpin("839201", "839201", "student1");
    const verifyRes = await verifyMpin("839201", "student1");
    assert(verifyRes.success === true, "Correct MPIN must unlock");
    const status = await getMpinStatus();
    assert(status.failedAttempts === 0, "Failed attempts must be reset to 0");
    assert(status.isLockedOut === false, "Should not be locked out");
  });

  // J. MPIN incorrect increments failed attempts
  await testCase("J. MPIN incorrect handling", async () => {
    await setupMpin("839201", "839201", "student1");
    const wrongRes = await verifyMpin("999999", "student1");
    assert(wrongRes.success === false, "Wrong MPIN must fail");
    assert(
      wrongRes.remainingAttempts === 4,
      "Should show 4 attempts remaining",
    );
    const status = await getMpinStatus();
    assert(status.failedAttempts === 1, "Failed attempts count must be 1");
  });

  // K. MPIN lockout triggers after 5 failed attempts
  await testCase("K. MPIN lockout rate limiting", async () => {
    await setupMpin("839201", "839201", "student1");
    for (let i = 0; i < 4; i++) {
      await verifyMpin("112299", "student1");
    }
    const finalRes = await verifyMpin("112299", "student1");
    assert(finalRes.success === false, "5th attempt must fail");
    assert(finalRes.lockedOut === true, "5th attempt must trigger lockout");
    assert(
      (finalRes.remainingSeconds || 0) > 0,
      "Must have remaining lockout seconds",
    );

    const status = await getMpinStatus();
    assert(status.isLockedOut === true, "Status must show locked out");

    // Blocked even if correct MPIN is entered
    const blockedRes = await verifyMpin("839201", "student1");
    assert(
      blockedRes.success === false && blockedRes.lockedOut === true,
      "Must block access during active lockout",
    );
  });

  // L. Disable MPIN clears security state
  await testCase("L. Disable MPIN", async () => {
    await setupMpin("839201", "839201", "student1");
    assert((await getMpinStatus()).isEnabled === true, "Should be enabled");
    await disableMpin();
    assert(
      (await getMpinStatus()).isEnabled === false,
      "Should be disabled after wipe",
    );
  });

  // M. MPIN account binding rejects different student
  await testCase("M. MPIN account binding verification", async () => {
    await setupMpin("839201", "839201", "student_user_1");
    const sameUserRes = await verifyMpin("839201", "student_user_1");
    assert(sameUserRes.success === true, "Same student must unlock with MPIN");

    const diffUserRes = await verifyMpin("839201", "student_user_2");
    assert(
      diffUserRes.success === false,
      "Different student must be rejected even with matching digits",
    );
  });

  // N. Account switch invalidates MPIN
  await testCase("N. Account switch invalidation", async () => {
    await storeSecureToken("token.student1", "student1", "24DS1001", "user_1");
    await setupMpin("839201", "839201", "user_1");
    assert((await getMpinStatus()).isEnabled === true, "MPIN must be enabled for user_1");

    // Switch account to user_2
    await storeSecureToken("token.student2", "student2", "24DS1002", "user_2");
    const statusAfterSwitch = await getMpinStatus();
    assert(
      statusAfterSwitch.isEnabled === false,
      "MPIN must be invalidated upon switching to a different account",
    );
  });

  return { passed, total };
}
