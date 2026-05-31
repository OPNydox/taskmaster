import {
  appendWorklog,
  getTask,
  updateTask,
} from "@taskmaster/core";
import { errorResponse, jsonResponse, requireProjectRoot } from "@/lib/project";
import { runCursorAgent } from "@/lib/run-agent";
import { loadSettings } from "@/lib/settings";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const projectRoot = await requireProjectRoot();
    const { id } = await params;
    const task = await getTask(projectRoot, id);
    if (!task) return errorResponse("Task not found", 404);

    const settings = await loadSettings();
    const apiKey =
      settings.cursorApiKey ?? process.env.CURSOR_API_KEY ?? undefined;
    if (!apiKey) {
      return errorResponse(
        "Cursor API key required. Set CURSOR_API_KEY or save it in Settings.",
        400,
      );
    }

    const { status, runId, summary } = await runCursorAgent(
      projectRoot,
      task,
      apiKey,
    );

    const actor = "agent:taskmaster-ui";

    await appendWorklog(projectRoot, id, {
      type: "work_done",
      actor,
      summary,
      files: [],
    });

    await appendWorklog(projectRoot, id, {
      type: "token_usage",
      actor,
      model: "composer-2.5",
      tokensIn: 0,
      tokensOut: 0,
      runId,
    });

    await updateTask(projectRoot, id, { status: "in_review" });

    return jsonResponse({
      status,
      runId,
      summaryPreview: summary.slice(0, 500),
    });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Agent run failed",
      500,
    );
  }
}
