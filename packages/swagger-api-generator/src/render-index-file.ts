import { createGeneratedFileHeader } from "./generated-file";
import type { ApiGeneratedGroup } from "./types";

export const createDefaultIndexFile = (
  groups: readonly ApiGeneratedGroup[],
): string => {
  const exports = groups.flatMap((group) => [
    `export * from "./${group.directoryName}/api";`,
    `export * from "./${group.directoryName}/types";`,
  ]);

  return [createGeneratedFileHeader(), ...exports, ""].join("\n");
};
