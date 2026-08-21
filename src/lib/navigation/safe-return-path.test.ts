import { describe, expect, it } from "vitest";
import { sanitizeInternalReturnPath } from "./safe-return-path";

describe("sanitizeInternalReturnPath", () => {
  it("allows relative paths", () => {
    expect(sanitizeInternalReturnPath("/reader")).toBe("/reader");
    expect(sanitizeInternalReturnPath("/study/deck-id")).toBe("/study/deck-id");
  });

  it("rejects external and protocol-relative URLs", () => {
    expect(sanitizeInternalReturnPath("https://evil.com")).toBeNull();
    expect(sanitizeInternalReturnPath("//evil.com")).toBeNull();
    expect(sanitizeInternalReturnPath("reader")).toBeNull();
  });
});
