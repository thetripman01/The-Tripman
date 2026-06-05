import { rateLimit, clearRateLimit } from "../rate-limit";

describe("rateLimit", () => {
  // Use a unique key per test so tests don't bleed state into each other
  // via the module-level Map.
  it("allows up to `limit` hits then blocks", () => {
    const key = "test-allow-block-" + Date.now();
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("1.1.1.1", { key, limit: 3, windowMs: 60_000 }).ok).toBe(
        true,
      );
    }
    const fourth = rateLimit("1.1.1.1", {
      key,
      limit: 3,
      windowMs: 60_000,
    });
    expect(fourth.ok).toBe(false);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks separate IPs independently", () => {
    const key = "test-iso-ips-" + Date.now();
    for (let i = 0; i < 2; i++) {
      rateLimit("2.2.2.2", { key, limit: 2, windowMs: 60_000 });
    }
    expect(rateLimit("2.2.2.2", { key, limit: 2, windowMs: 60_000 }).ok).toBe(
      false,
    );
    // Different IP, fresh quota
    expect(rateLimit("3.3.3.3", { key, limit: 2, windowMs: 60_000 }).ok).toBe(
      true,
    );
  });

  it("tracks separate keys independently", () => {
    const k1 = "test-iso-keys-a-" + Date.now();
    const k2 = "test-iso-keys-b-" + Date.now();
    for (let i = 0; i < 2; i++) {
      rateLimit("4.4.4.4", { key: k1, limit: 2, windowMs: 60_000 });
    }
    expect(
      rateLimit("4.4.4.4", { key: k1, limit: 2, windowMs: 60_000 }).ok,
    ).toBe(false);
    // Different key, fresh quota for same IP
    expect(
      rateLimit("4.4.4.4", { key: k2, limit: 2, windowMs: 60_000 }).ok,
    ).toBe(true);
  });

  it("clearRateLimit resets the bucket", () => {
    const key = "test-clear-" + Date.now();
    rateLimit("5.5.5.5", { key, limit: 1, windowMs: 60_000 });
    expect(rateLimit("5.5.5.5", { key, limit: 1, windowMs: 60_000 }).ok).toBe(
      false,
    );
    clearRateLimit("5.5.5.5", key);
    expect(rateLimit("5.5.5.5", { key, limit: 1, windowMs: 60_000 }).ok).toBe(
      true,
    );
  });

  it("uses a separate blockDuration when set", () => {
    const key = "test-block-dur-" + Date.now();
    rateLimit("6.6.6.6", { key, limit: 1, windowMs: 60_000 });
    const blocked = rateLimit("6.6.6.6", {
      key,
      limit: 1,
      windowMs: 60_000,
      blockDurationMs: 600_000,
    });
    expect(blocked.ok).toBe(false);
    // retryAfterSeconds should reflect the longer block window
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(590);
  });
});
