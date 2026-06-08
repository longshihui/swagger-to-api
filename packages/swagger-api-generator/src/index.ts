import { definePackageMetadata } from "@cm/shared";
import type { PackageMetadata } from "@cm/shared";

export const swaggerApiGeneratorMetadata: PackageMetadata =
  definePackageMetadata({
    name: "@cm/swagger-api-generator",
    description: "API 文件生成器",
  });
