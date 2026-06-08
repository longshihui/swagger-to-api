import { describe, expect, it } from "vitest";
import { definePackageMetadata } from "./index";

describe("definePackageMetadata", () => {
  it("returns package metadata without mutation", () => {
    const metadata = definePackageMetadata({
      name: "@cm/shared",
      description: "公共代码",
    });

    expect(metadata).toEqual({
      name: "@cm/shared",
      description: "公共代码",
    });
  });
});
