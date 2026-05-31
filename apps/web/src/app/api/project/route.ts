import {
  isProjectInitialized,
  initProject,
} from "@taskmaster/core";
import path from "node:path";
import { errorResponse, jsonResponse } from "@/lib/project";
import { getProjectRoot, setProjectRoot } from "@/lib/settings";

export async function GET() {
  const projectRoot = await getProjectRoot();
  if (!projectRoot) {
    return jsonResponse({ projectRoot: null, initialized: false });
  }
  const initialized = await isProjectInitialized(projectRoot);
  return jsonResponse({ projectRoot, initialized });
}

export async function POST(request: Request) {
  const body = await request.json();
  const projectPath = body.projectPath as string | undefined;
  if (!projectPath?.trim()) {
    return errorResponse("projectPath is required");
  }

  const resolved = path.resolve(projectPath.trim());
  const settings = await setProjectRoot(resolved);
  const initialized = await isProjectInitialized(resolved);

  return jsonResponse({
    projectRoot: settings.projectRoot,
    initialized,
    recentProjects: settings.recentProjects,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const action = body.action as string;

  if (action === "init") {
    const projectRoot = await getProjectRoot();
    if (!projectRoot) {
      return errorResponse("Select a project path first", 400);
    }
    try {
      const result = await initProject(projectRoot, {
        includeSampleTask: body.includeSampleTask !== false,
      });
      return jsonResponse({
        initialized: true,
        taskmasterDir: result.taskmasterDir,
        sampleTaskId: result.sampleTaskId,
      });
    } catch (err) {
      return errorResponse(
        err instanceof Error ? err.message : "Init failed",
        409,
      );
    }
  }

  return errorResponse("Unknown action");
}
