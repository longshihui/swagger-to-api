export const createGeneratedFileHeader = (): string =>
  [
    "/* eslint-disable */",
    "/* 该文件由 @lsh/swagger-api-generator 自动生成，请勿手动修改。 */",
  ].join("\n");
