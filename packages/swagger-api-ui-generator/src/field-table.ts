import {
  createTypeLiteralFromSchema,
  type ApiParameterModel,
  type ApiSchemaModel,
} from "@lsh/swagger-api-generator";
import { code, createMarkdownTable, formatValue } from "./markdown";

interface FieldTableRow {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description?: string;
  readonly example?: unknown;
  readonly enum?: readonly unknown[];
}

export const createParameterFieldTable = (
  parameters: readonly ApiParameterModel[],
): string =>
  createFieldTable(
    parameters.map((parameter) => ({
      name: parameter.name,
      type: createTypeLiteralFromSchema(parameter.schema),
      required: parameter.required,
      ...(parameter.description === undefined
        ? {}
        : { description: parameter.description }),
      ...(parameter.example === undefined
        ? {}
        : { example: parameter.example }),
      ...(parameter.schema.enum === undefined
        ? {}
        : { enum: parameter.schema.enum }),
    })),
  );

export const createSchemaFieldTable = (
  schema: ApiSchemaModel,
  options: { readonly required: boolean },
): string => createFieldTable(createSchemaRows(schema, options));

const createSchemaRows = (
  schema: ApiSchemaModel,
  options: { readonly prefix?: string; readonly required: boolean },
): readonly FieldTableRow[] => {
  const rows: FieldTableRow[] = [];
  const rowName = options.prefix ?? "$";

  rows.push({
    name: rowName,
    type: createTypeLiteralFromSchema(schema),
    required: options.required,
    ...(schema.description === undefined
      ? {}
      : { description: schema.description }),
    ...(schema.example === undefined ? {} : { example: schema.example }),
    ...(schema.enum === undefined ? {} : { enum: schema.enum }),
  });

  if (schema.properties) {
    const requiredNames = new Set(schema.required ?? []);

    for (const [propertyName, propertySchema] of Object.entries(
      schema.properties,
    )) {
      rows.push(
        ...createSchemaRows(propertySchema, {
          prefix:
            options.prefix === undefined
              ? propertyName
              : `${options.prefix}.${propertyName}`,
          required: requiredNames.has(propertyName),
        }),
      );
    }
  }

  if (schema.items && schema.items.properties) {
    rows.push(
      ...createSchemaRows(schema.items, {
        prefix: `${rowName}[]`,
        required: false,
      }),
    );
  }

  return rows;
};

const createFieldTable = (rows: readonly FieldTableRow[]): string =>
  createMarkdownTable(
    ["字段", "类型", "必填", "说明", "示例", "枚举"],
    rows.map((row) => [
      row.name,
      code(row.type),
      row.required ? "是" : "否",
      row.description ?? "",
      row.example === undefined ? "" : code(formatValue(row.example)),
      row.enum === undefined ? "" : row.enum.map(formatValue).join(", "),
    ]),
  );
