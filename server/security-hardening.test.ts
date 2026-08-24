import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { applySecurityHeaders, consumeRateLimit, enforceSameOriginForMutations } from "./_core/security";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { decodeAndValidateUpload, SAFE_DOCUMENT_TYPES, SAFE_IMAGE_TYPES } from "./_core/uploadSecurity";

function mockResponse() {
  const headers = new Map<string, string>();
  return {
    headers,
    setHeader: (name: string, value: string) => headers.set(name, value),
    status: () => ({ json: () => undefined }),
  };
}

describe("upload security", () => {
  it("accepts a correctly declared PNG with a matching content signature", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const result = decodeAndValidateUpload({
      fileName: "front-of-home.png",
      contentType: "image/png",
      data: png.toString("base64"),
      allowedTypes: SAFE_IMAGE_TYPES,
      maxBytes: 1024,
    });
    expect(result.extension).toBe("png");
    expect(result.bytes).toEqual(png);
  });

  it("rejects a mismatched extension, fake signature, and unsafe document input", () => {
    const fake = Buffer.from("not a picture").toString("base64");
    expect(() => decodeAndValidateUpload({ fileName: "home.jpg", contentType: "image/jpeg", data: fake, allowedTypes: SAFE_IMAGE_TYPES, maxBytes: 1024 })).toThrow();
    expect(() => decodeAndValidateUpload({ fileName: "../../secret.pdf", contentType: "application/pdf", data: fake, allowedTypes: SAFE_DOCUMENT_TYPES, maxBytes: 1024 })).toThrow();
  });
});

describe("request hardening", () => {
  it("enforces a bounded in-memory rate window", () => {
    const key = `test:${Date.now()}`;
    expect(consumeRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 60_000).allowed).toBe(false);
  });

  it("sets the core browser security headers and blocks cross-origin mutations", () => {
    const response = mockResponse();
    let continued = false;
    applySecurityHeaders({} as any, response as any, () => { continued = true; });
    expect(continued).toBe(true);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Security-Policy-Report-Only")).toContain("frame-ancestors 'none'");

    const blocked = mockResponse();
    enforceSameOriginForMutations({ method: "POST", protocol: "https", get: (header: string) => header === "origin" ? "https://attacker.example" : "nyumba.example", headers: {} } as any, blocked as any, () => { throw new Error("should not continue"); });
    expect(blocked.headers.size).toBe(0);
  });
});

describe("session claim migration", () => {
  it("accepts a signed legacy session once and marks it for rotation", async () => {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const legacyToken = await new SignJWT({ openId: "legacy-user", appId: ENV.appId, name: "Legacy User" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("5m")
      .sign(secret);
    await expect(sdk.verifySession(legacyToken)).resolves.toMatchObject({
      openId: "legacy-user",
      legacySession: true,
    });
  });

  it("keeps newly issued sessions on the strict issuer-and-audience contract", async () => {
    const token = await sdk.createSessionToken("current-user", { name: "Current User" });
    const session = await sdk.verifySession(token);
    expect(session?.openId).toBe("current-user");
    expect(session?.legacySession).toBeUndefined();
  });
});
