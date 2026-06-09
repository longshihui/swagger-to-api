import { createEndpointTypeDeclarations } from "./type-declarations";
import { createGeneratedFileHeader } from "./generated-file";
import type { ApiTemplateContext } from "./types";

export const createDefaultTypeFile = (
  context: ApiTemplateContext,
): string => {
  const declarations = new Map<string, string>();

  for (const endpointContext of context.endpointContexts) {
    const endpointDeclarations = createEndpointTypeDeclarations(
      endpointContext.endpoint,
      endpointContext,
    );

    for (const declaration of endpointDeclarations) {
      if (!declarations.has(declaration.name)) {
        declarations.set(declaration.name, declaration.content);
      }
    }
  }

  return [
    createGeneratedFileHeader(),
    ...Array.from(declarations.values()),
    "",
  ].join("\n\n");
};
