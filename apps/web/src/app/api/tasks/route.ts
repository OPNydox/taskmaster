import {
  TaskmasterNotInitializedError,
  createTask,
  listTasksWithWarnings,
} from "@taskmaster/core";
import { errorResponse, jsonResponse, requireProjectRoot } from "@/lib/project";

function tasksErrorStatus(err: unknown): number {
  if (err instanceof TaskmasterNotInitializedError) return 400;
  if (err instanceof Error && err.message.includes("No project")) return 400;
  return 500;
}

export async function GET() {
  try {
    const projectRoot = await requireProjectRoot();
    const { tasks, warnings } = await listTasksWithWarnings(projectRoot);
    return jsonResponse({
      tasks,
      ...(warnings.length > 0 ? { warnings } : {}),
    });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to list tasks",
      tasksErrorStatus(err),
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
