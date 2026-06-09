import { describe, expect, it } from "vitest";
import { swaggerToApiCliMetadata } from "../src/index";

describe("swaggerToApiCliMetadata", () => {
  it("应该使用正确的包名", () => {
    expect(swaggerToApiCliMetadata.name).toBe("@cm/swagger-to-api-cli");
  });
});
