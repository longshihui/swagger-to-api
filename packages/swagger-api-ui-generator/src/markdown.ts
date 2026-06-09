export const createMarkdownTable = (
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string => {
  const headerRow = `| ${headers.map(escapeTableCell).join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyRows = rows.map(
    (row) => `| ${row.map(escapeTableCell).join(" | ")} |`,
  );

  return [headerRow, separatorRow, ...bodyRows].join("\n");
};

export const code = (value: string): string =>
  `\`${value.replaceAll("`", "\\`")}\``;

export const formatValue = (value: unknown): string => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return JSON.stringify(value);
  }

  return JSON.stringify(value);
};

export const escapeMarkdownText = (value: string): string =>
  value.replaceAll("#", "\\#");

const escapeTableCell = (value: string): string =>
  value.replaceAll("|", "\\|").replaceAll("\n", "<br>");
