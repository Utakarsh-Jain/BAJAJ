import { identity } from "../config/identity.js";
import { processHierarchy } from "../services/hierarchyService.js";

export function handleHierarchyRequest(request, response) {
  const result = processHierarchy(request.body?.data);

  if (result.error) {
    response.status(400).json({
      ...identity,
      error: result.error
    });
    return;
  }

  response.status(200).json({
    ...identity,
    ...result
  });
}
