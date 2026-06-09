import { formatObjectKey, toPascalCase } from "./naming";
import type { ApiParameterModel, ApiSchemaModel } from "./types";

interface InterfacePropertyModel {
  readonly name: string;
  readonly required: boolean;
  readonly schema: ApiSchemaModel;
  readonly description?: string;
  readonly example?: unknown;
}

export interface TypeDeclarationModel {
  readonly name: string;
  readonly content: string;
}

export const createParameterInterface = (
  typeName: string,
  parameters: readonly ApiParameterModel[],
): TypeDeclarationModel => {
  const properties = parameters.map((parameter) => {
    const property: InterfacePropertyModel = {
      name: parameter.name,
      required: parameter.required,
      schema: parameter.schema,
    };

    return {
      ...property,
      ...(parameter.description === undefined
        ? {}
        : { description: parameter.description }),
      ...(parameter.example === undefined
        ? {}
        : { example: parameter.example }),
    };
  });

  return createInterfaceDeclaration(typeName, properties);
};

export const createSchemaDeclaration = (
  typeName: string,
  schema: ApiSchemaModel,
): TypeDeclarationModel => {
  if (schema.name && toPascalCase(schema.name) !== typeName) {
    return {
      name: typeName,
      content: `export type ${typeName} = ${toPascalCase(schema.name)};`,
    };
  }

  if (isObjectSchema(schema)) {
    return createInterfaceDeclaration(typeName, createSchemaProperties(schema));
  }

  const anonymousSchema = { ...schema };
  delete anonymousSchema.name;

  return {
    name: typeName,
    content: `export type ${typeName} = ${schemaToType(anonymousSchema)};`,
  };
};

export const schemaToType = (schema: ApiSchemaModel): string => {
  const baseType = schemaToNonNullableType(schema);

  if (schema.nullable === true && baseType !== "null") {
    return `${baseType} | null`;
  }

  return baseType;
};

const schemaToNonNullableType = (schema: ApiSchemaModel): string => {
  if (schema.name) {
    return toPascalCase(schema.name);
  }

  const unionType = schema.enum ? enumToType(schema.enum) : undefined;

  if (unionType) {
    return unionType;
  }

  if (schema.allOf && schema.allOf.length > 0) {
    return schema.allOf.map(schemaToType).join(" & ");
  }

  if (schema.anyOf && schema.anyOf.length > 0) {
    return schema.anyOf.map(schemaToType).join(" | ");
  }

  if (schema.oneOf && schema.oneOf.length > 0) {
    return schema.oneOf.map(schemaToType).join(" | ");
  }

  switch (schema.type) {
    case "array":
      return `Array<${schema.items ? schemaToType(schema.items) : "unknown"}>`;
    case "boolean":
      return "boolean";
    case "integer":
    case "number":
      return "number";
    case "null":
      return "null";
    case "object":
      return objectSchemaToType(schema);
    case "string":
      return "string";
    default:
      return "unknown";
  }
};

const objectSchemaToType = (schema: ApiSchemaModel): string => {
  const properties = schema.properties;

  if (properties && Object.keys(properties).length > 0) {
    const requiredNames = new Set(schema.required ?? []);
    const members = Object.entries(properties).map(
      ([propertyName, propertySchema]) => {
        const optionalMark = requiredNames.has(propertyName) ? "" : "?";
        return `${formatObjectKey(propertyName)}${optionalMark}: ${schemaToType(propertySchema)}`;
      },
    );

    return `{ ${members.join("; ")} }`;
  }

  if (schema.additionalProperties && schema.additionalProperties !== true) {
    return `Record<string, ${schemaToType(schema.additionalProperties)}>`;
  }

  return "Record<string, unknown>";
};

const createInterfaceDeclaration = (
  typeName: string,
  properties: readonly InterfacePropertyModel[],
): TypeDeclarationModel => {
  if (properties.length === 0) {
    return {
      name: typeName,
      content: `export interface ${typeName} {\n  [key: string]: unknown;\n}`,
    };
  }

  const lines = [`export interface ${typeName} {`];

  for (const property of properties) {
    const jsDoc = createPropertyJsDoc(property);
    if (jsDoc) {
      lines.push(jsDoc);
    }

    const optionalMark = property.required ? "" : "?";
    lines.push(
      `  ${formatObjectKey(property.name)}${optionalMark}: ${schemaToType(property.schema)};`,
    );
  }

  lines.push("}");

  return {
    name: typeName,
    content: lines.join("\n"),
  };
};

const createSchemaProperties = (
  schema: ApiSchemaModel,
): readonly InterfacePropertyModel[] => {
  const properties = schema.properties;

  if (!properties) {
    return [];
  }

  const requiredNames = new Set(schema.required ?? []);

  return Object.entries(properties).map(([propertyName, propertySchema]) => ({
    name: propertyName,
    required: requiredNames.has(propertyName),
    schema: propertySchema,
    ...(propertySchema.description === undefined
      ? {}
      : { description: propertySchema.description }),
    ...(propertySchema.example === undefined
      ? {}
      : { example: propertySchema.example }),
  }));
};

const createPropertyJsDoc = (property: InterfacePropertyModel): string => {
  const lines: string[] = [];

  if (property.description) {
    lines.push(property.description);
  }

  const enumValues = property.schema.enum;
  if (enumValues && enumValues.length > 0) {
    lines.push(`@enum ${enumValues.map(formatJsDocValue).join(" | ")}`);
  }

  const example = property.example ?? property.schema.example;
  if (example !== undefined) {
    lines.push(`@example ${formatJsDocValue(example)}`);
  }

  if (lines.length === 0) {
    return "";
  }

  return ["  /**", ...lines.map((line) => `   * ${line}`), "   */"].join("\n");
};

const enumToType = (values: readonly unknown[]): string | undefined => {
  const literals = values
    .map(unknownToLiteral)
    .filter((value) => value !== undefined);

  if (literals.length !== values.length || literals.length === 0) {
    return undefined;
  }

  return literals.join(" | ");
};

const unknownToLiteral = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return JSON.stringify(value);
  }

  return undefined;
};

const formatJsDocValue = (value: unknown): string => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return JSON.stringify(value);
  }

  return JSON.stringify(value, null, 2);
};

const isObjectSchema = (schema: ApiSchemaModel): boolean =>
  schema.type === "object" || schema.properties !== undefined;
