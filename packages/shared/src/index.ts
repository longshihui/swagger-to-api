export interface PackageMetadata {
  readonly name: string;
  readonly description: string;
}

export const definePackageMetadata = (
  metadata: PackageMetadata,
): PackageMetadata => metadata;

export const toKebabCase = (value: string): string => {
  const words = splitWords(value);

  if (words.length === 0) {
    return "default";
  }

  return words.join("-");
};

const splitWords = (value: string): string[] => {
  const asciiValue = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .toLowerCase();

  if (!asciiValue) {
    return [];
  }

  return asciiValue.split(/\s+/u);
};
