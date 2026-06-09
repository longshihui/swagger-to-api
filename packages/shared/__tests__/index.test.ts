import { describe, expect, it } from "vitest";
import { definePackageMetadata } from "../src/index";

describe("definePackageMetadata", () => {
  it("应该原样返回包元信息", () => {
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
