import { describe, expect, it } from "vitest";
import { definePackageMetadata, toKebabCase } from "../src/index";

describe("definePackageMetadata", () => {
  it("应该原样返回包元信息", () => {
    const metadata = definePackageMetadata({
      name: "@lsh/shared",
      description: "公共代码",
    });

    expect(metadata).toEqual({
      name: "@lsh/shared",
      description: "公共代码",
    });
  });
});

describe("toKebabCase", () => {
  it("应该把常见命名格式转换为 kebab-case", () => {
    expect(toKebabCase("ContractDetail")).toBe("contract-detail");
    expect(toKebabCase("contract_detail")).toBe("contract-detail");
    expect(toKebabCase("GET /contract/{id}")).toBe("get-contract-id");
  });

  it("应该在没有有效单词时返回默认名称", () => {
    expect(toKebabCase("")).toBe("default");
    expect(toKebabCase("///")).toBe("default");
  });
});
