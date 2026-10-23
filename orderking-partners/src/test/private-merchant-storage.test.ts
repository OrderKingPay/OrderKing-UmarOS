import { describe, expect, it } from "vitest";
import { isValidDocumentMagic } from "../lib/adapters/storage-private.server";

const padded = (...head: number[]) => Uint8Array.from([...head, ...new Array(Math.max(0, 12 - head.length)).fill(0)]);

describe("Private merchant document content validation", () => {
  it("accepts a real PDF header", () => {
    expect(isValidDocumentMagic(padded(0x25, 0x50, 0x44, 0x46, 0x2d), "application/pdf")).toBe(true);
  });
  it("rejects renamed files whose contents do not match declared type", () => {
    expect(isValidDocumentMagic(padded(0x25, 0x50, 0x44, 0x46, 0x2d), "image/png")).toBe(false);
    expect(isValidDocumentMagic(padded(0xff, 0xd8, 0xff), "application/pdf")).toBe(false);
  });
  it("accepts valid PNG and JPEG signature bytes", () => {
    expect(isValidDocumentMagic(padded(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a), "image/png")).toBe(true);
    expect(isValidDocumentMagic(padded(0xff,0xd8,0xff), "image/jpeg")).toBe(true);
  });
  it("requires the actual WEBP container signature", () => {
    expect(isValidDocumentMagic(Uint8Array.from([82,73,70,70,0,0,0,0,87,69,66,80]), "image/webp")).toBe(true);
    expect(isValidDocumentMagic(padded(82,73,70,70), "image/webp")).toBe(false);
  });
  it("rejects truncated and unsupported documents", () => {
    expect(isValidDocumentMagic(new Uint8Array([0x25,0x50,0x44]), "application/pdf")).toBe(false);
    expect(isValidDocumentMagic(padded(0x25,0x50,0x44,0x46,0x2d), "text/html")).toBe(false);
  });
});
