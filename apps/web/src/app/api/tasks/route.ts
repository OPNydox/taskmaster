import { createTask, listTasks } from "@taskmaster/core";
import { errorResponse, jsonResponse, requireProjectRoot } from "@/lib/project";

export async function GET() {
  try {
    const projectRoot = await requireProjectRoot();
    const tasks = await listTasks(projectRoot);
    return jsonResponse({ tasks });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to list tasks",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const projectRoot = await requireProjectRoot();
    const body = await request.json();
    const task = await createTask(projectRoot, body);
    return jsonResponse({ task }, 201);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to create task",
      400,
    );
  }
}
