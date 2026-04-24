import { identity } from "../src/config/identity.js";
import { processHierarchy } from "../src/services/hierarchyService.js";

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default function handler(request, response) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({
      error: "Method not allowed"
    });
    return;
  }

  try {
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
  } catch {
    response.status(400).json({
      ...identity,
      error: "Invalid JSON payload."
    });
  }
}
