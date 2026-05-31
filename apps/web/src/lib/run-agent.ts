import type { Task } from "@taskmaster/core";

export interface RunAgentResult {
  status: string;
  runId: string | null;
  summary: string;
}

export async function runCursorAgent(
  projectRoot: string,
  task: Task,
  apiKey: string,
): Promise<RunAgentResult> {
  const { Agent } = await import("@cursor/sdk");

  const prompt = [
    `You are working on Taskmaster task ${task.id}: ${task.title}`,
    task.description ? `\nDescription:\n${task.description}` : "",
    "\nComplete the work, then summarize what you did.",
  ].join("");

  const result = await Agent.prompt(prompt, {
    apiKey,
    model: { id: "composer-2.5" },
    local: { cwd: projectRoot },
  });

  const summary =
    typeof result.result === "string"
      ? result.result.slice(0, 2000)
      : JSON.stringify(result.result).slice(0, 2000);

  const runId =
    (result as { id?: string }).id ??
    (result as { runId?: string }).runId ??
    null;

  return {
    status: String(result.status ?? "unknown"),
    runId,
    summary,
  };
}
