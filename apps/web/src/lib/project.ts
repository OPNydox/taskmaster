import { getProjectRoot } from "./settings";

export async function requireProjectRoot(): Promise<string> {
  const root = await getProjectRoot();
  if (!root) {
    throw new Error("No project selected. Set a project path on the home screen.");
  }
  return root;
}

export function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function errorResponse(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}
