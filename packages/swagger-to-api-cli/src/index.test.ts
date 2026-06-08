import { describe, expect, it } from "vitest";
import { swaggerToApiCliMetadata } from "./index";

describe("swaggerToApiCliMetadata", () => {
  it("uses the expected package name", () => {
    expect(swaggerToApiCliMetadata.name).toBe("@cm/swagger-to-api-cli");
  });
});
