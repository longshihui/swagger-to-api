import type { ApiEndpointModel, ApiResponseModel } from "./types";
import { ApiGeneratorError } from "./types";

const RESPONSE_PRIORITY = ["200", "201", "default"];

export const selectApiResponse = (
  endpoint: ApiEndpointModel,
): ApiResponseModel => {
  for (const statusCode of RESPONSE_PRIORITY) {
    const response = endpoint.responses.find(
      (item) => item.statusCode === statusCode && item.schema !== undefined,
    );

    if (response) {
      return response;
    }
  }

  const response = endpoint.responses.find((item) => item.schema !== undefined);

  if (!response) {
    throw new ApiGeneratorError(
      `接口 ${endpoint.id} 缺少可用于生成类型的 response schema`,
    );
  }

  return response;
};
