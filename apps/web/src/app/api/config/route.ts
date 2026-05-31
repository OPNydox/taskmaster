import { loadConfig } from "@taskmaster/core";
import { errorResponse, jsonResponse, requireProjectRoot } from "@/lib/project";

export async function GET() {
  try {
    const projectRoot = await requireProjectRoot();
    const config = await loadConfig(projectRoot);
    return jsonResponse(config);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to load config",
      err instanceof Error && err.message.includes("No project") ? 400 : 500,
    );
  }
}
