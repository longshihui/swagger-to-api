const RESERVED_WORDS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
]);

const IDENTIFIER_PATTERN = /^[A-Za-z_$][\w$]*$/;

export const toPascalCase = (value: string): string => {
  const words = splitWords(value);

  if (words.length === 0) {
    return "Generated";
  }

  return words
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join("");
};

export const toCamelCase = (value: string): string => {
  const pascalName = toPascalCase(value);
  return `${pascalName.charAt(0).toLowerCase()}${pascalName.slice(1)}`;
};

export const toKebabCase = (value: string): string => {
  const words = splitWords(value);

  if (words.length === 0) {
    return "default";
  }

  return words.join("-");
};

export const isIdentifierName = (value: string): boolean =>
  IDENTIFIER_PATTERN.test(value) && !RESERVED_WORDS.has(value);

export const formatObjectKey = (value: string): string => {
  if (isIdentifierName(value)) {
    return value;
  }

  return JSON.stringify(value);
};

export const formatPropertyAccess = (
  objectName: string,
  key: string,
): string => {
  if (isIdentifierName(key)) {
    return `${objectName}.${key}`;
  }

  return `${objectName}[${JSON.stringify(key)}]`;
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
