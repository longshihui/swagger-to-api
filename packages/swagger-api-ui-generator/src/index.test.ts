import { describe, expect, it } from "vitest";
import { swaggerApiUiGeneratorMetadata } from "./index";

describe("swaggerApiUiGeneratorMetadata", () => {
  it("uses the expected package name", () => {
    expect(swaggerApiUiGeneratorMetadata.name).toBe(
      "@cm/swagger-api-ui-generator",
    );
  });
});
