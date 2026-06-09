import { describe, expect, it } from "vitest";
import { swaggerApiUiGeneratorMetadata } from "../src/index";

describe("swaggerApiUiGeneratorMetadata", () => {
  it("应该使用正确的包名", () => {
    expect(swaggerApiUiGeneratorMetadata.name).toBe(
      "@cm/swagger-api-ui-generator",
    );
  });
});
