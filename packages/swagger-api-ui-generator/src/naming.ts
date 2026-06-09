export const toKebabCase = (value: string): string => {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .split(/\s+/u)
    .filter(Boolean);

  if (words.length === 0) {
    return "default";
  }

  return words.join("-");
};
