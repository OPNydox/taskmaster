import { deleteTask, getTask, updateTask } from "@taskmaster/core";
import { errorResponse, jsonResponse, requireProjectRoot } from "@/lib/project";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const projectRoot = await requireProjectRoot();
    const { id } = await params;
    const task = await getTask(projectRoot, id);
    if (!task) return errorResponse("Task not found", 404);
    return jsonResponse({ task });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to get task",
      500,
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const projectRoot = await requireProjectRoot();
    const { id } = await params;
    const body = await request.json();
    const task = await updateTask(projectRoot, id, body);
    return jsonResponse({ task });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to update task",
      400,
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const projectRoot = await requireProjectRoot();
    const { id } = await params;
    await deleteTask(projectRoot, id);
    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to delete task",
      400,
    );
  }
}
