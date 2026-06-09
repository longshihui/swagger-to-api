import { toPascalCase } from "./naming";
import {
  createParameterInterface,
  createSchemaDeclaration,
  type TypeDeclarationModel,
} from "./schema";
import { filterParameters } from "./endpoint-context";
import { selectApiResponse } from "./response";
import type {
  ApiEndpointModel,
  ApiSchemaModel,
  ApiTemplateEndpointContext,
} from "./types";

export const createEndpointTypeDeclarations = (
  endpoint: ApiEndpointModel,
  context: ApiTemplateEndpointContext,
): readonly TypeDeclarationModel[] => {
  const declarations: TypeDeclarationModel[] = [];
  const pathParameters = filterParameters(endpoint, "path");
  const queryParameters = filterParameters(endpoint, "query");
  const headerParameters = filterParameters(endpoint, "header");

  if (context.pathTypeName) {
    declarations.push(
      createParameterInterface(context.pathTypeName, pathParameters),
    );
  }

  if (context.queryTypeName) {
    declarations.push(
      createParameterInterface(context.queryTypeName, queryParameters),
    );
  }

  if (context.headerTypeName) {
    declarations.push(
      createParameterInterface(context.headerTypeName, headerParameters),
    );
  }

  if (endpoint.requestBody && context.requestBodyTypeName) {
    declarations.push(
      ...createSchemaDeclarations(
        context.requestBodyTypeName,
        endpoint.requestBody,
      ),
    );
  }

  const response = selectApiResponse(endpoint);
  if (response.schema) {
    declarations.push(
      ...createSchemaDeclarations(context.responseTypeName, response.schema),
    );
  }

  return declarations;
};

const createSchemaDeclarations = (
  typeName: string,
  schema: ApiSchemaModel,
): readonly TypeDeclarationModel[] => {
  const declarations = new Map<string, string>();

  for (const namedSchema of collectNamedSchemas(schema)) {
    const namedSchemaTypeName = toPascalCase(namedSchema.name);
    const declaration = createSchemaDeclaration(
      namedSchemaTypeName,
      namedSchema,
    );
    declarations.set(declaration.name, declaration.content);
  }

  const rootDeclaration = createSchemaDeclaration(typeName, schema);
  declarations.set(rootDeclaration.name, rootDeclaration.content);

  return Array.from(declarations.entries()).map(([name, content]) => ({
    name,
    content,
  }));
};

const collectNamedSchemas = (
  schema: ApiSchemaModel,
): readonly (ApiSchemaModel & Required<Pick<ApiSchemaModel, "name">>)[] => {
  const schemas: ApiSchemaModel[] = [];
  collectNamedSchemaInto(schema, schemas);
  return schemas.filter(hasSchemaName);
};

const collectNamedSchemaInto = (
  schema: ApiSchemaModel,
  schemas: ApiSchemaModel[],
): void => {
  if (schema.name) {
    schemas.push(schema);
  }

  for (const childSchema of getChildSchemas(schema)) {
    collectNamedSchemaInto(childSchema, schemas);
  }
};

const getChildSchemas = (schema: ApiSchemaModel): readonly ApiSchemaModel[] => {
  const children: ApiSchemaModel[] = [];

  if (schema.items) {
    children.push(schema.items);
  }

  if (schema.additionalProperties && schema.additionalProperties !== true) {
    children.push(schema.additionalProperties);
  }

  if (schema.properties) {
    children.push(...Object.values(schema.properties));
  }

  children.push(...(schema.allOf ?? []));
  children.push(...(schema.anyOf ?? []));
  children.push(...(schema.oneOf ?? []));

  return children;
};

const hasSchemaName = (
  schema: ApiSchemaModel,
): schema is ApiSchemaModel & Required<Pick<ApiSchemaModel, "name">> =>
  schema.name !== undefined && schema.name !== "";
