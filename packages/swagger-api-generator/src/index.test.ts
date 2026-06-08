import { describe, expect, it } from "vitest";
import { swaggerApiGeneratorMetadata } from "./index";

describe("swaggerApiGeneratorMetadata", () => {
  it("uses the expected package name", () => {
    expect(swaggerApiGeneratorMetadata.name).toBe("@cm/swagger-api-generator");
  });
});
