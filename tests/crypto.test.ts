import { describe, it, expect } from "vitest";

// Set a valid 32-byte hex key before importing the module under test
process.env.TOKEN_ENCRYPTION_KEY = "a".repeat(64); // 64 hex chars = 32 bytes

import { encryptToken, decryptToken } from "../lib/crypto/tokens";

describe("tokens crypto", () => {
  it("round-trips a plaintext value", () => {
    const plain = "my-refresh-token-value-12345";
    const cipher = encryptToken(plain);
    expect(cipher).not.toBe(plain);
    expect(decryptToken(cipher)).toBe(plain);
  });

  it("encryptions of the same plaintext differ (random IV)", () => {
    const plain = "same-token";
    const c1 = encryptToken(plain);
    const c2 = encryptToken(plain);
    expect(c1).not.toBe(c2);
  });

  it("throws on tampered auth tag", () => {
    const plain = "token";
    const cipher = encryptToken(plain);
    const parts = cipher.split(":");
    // Corrupt the auth tag
    parts[1] = "0".repeat(parts[1].length);
    expect(() => decryptToken(parts.join(":"))).toThrow();
  });

  it("throws when TOKEN_ENCRYPTION_KEY is missing", () => {
    const saved = process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => encryptToken("x")).toThrow("TOKEN_ENCRYPTION_KEY");
    process.env.TOKEN_ENCRYPTION_KEY = saved;
  });

  it("throws when key is wrong length", () => {
    process.env.TOKEN_ENCRYPTION_KEY = "abc"; // too short
    expect(() => encryptToken("x")).toThrow();
    process.env.TOKEN_ENCRYPTION_KEY = "a".repeat(64);
  });
});
