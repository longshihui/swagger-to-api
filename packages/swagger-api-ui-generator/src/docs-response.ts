import {
  selectApiResponse,
  type ApiEndpointModel,
  type ApiResponseModel,
} from "@lsh/swagger-api-generator";
import { ApiDocsGeneratorError } from "./types";

export const selectApiDocsResponse = (
  endpoint: ApiEndpointModel,
): ApiResponseModel => {
  try {
    return selectApiResponse(endpoint);
  } catch {
    throw new ApiDocsGeneratorError(
      `接口 ${endpoint.id} 缺少可用于生成文档的 response schema`,
    );
  }
};
