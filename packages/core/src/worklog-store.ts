import fs from "node:fs/promises";
import path from "node:path";
import { configExists } from "./config.js";
import { getWorklogFilePath, getWorklogsDir } from "./paths.js";
import { getTask, TaskmasterNotInitializedError } from "./task-store.js";
import {
  appendWorklogInputSchema,
  tokenMetricsSchema,
  worklogEventSchema,
  type AppendWorklogInput,
  type TokenMetrics,
  type WorklogEvent,
} from "./schemas.js";

async function ensureInitialized(projectRoot: string): Promise<void> {
  if (!(await configExists(projectRoot))) {
    throw new TaskmasterNotInitializedError(projectRoot);
  }
}

function parseNdjsonLine(line: string): WorklogEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  return worklogEventSchema.parse(JSON.parse(trimmed));
}

export async function listWorklogEvents(
  projectRoot: string,
  taskId: string,
): Promise<WorklogEvent[]> {
  await ensureInitialized(projectRoot);
  const filePath = getWorklogFilePath(projectRoot, taskId);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const events = raw
      .split("\n")
      .map(parseNdjsonLine)
      .filter((e): e is WorklogEvent => e !== null);
    return events.sort(
      (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime(),
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function appendWorklog(
  projectRoot: string,
  taskId: string,
  input: AppendWorklogInput,
): Promise<WorklogEvent> {
  await ensureInitialized(projectRoot);
  const task = await getTask(projectRoot, taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const parsed = appendWorklogInputSchema.parse(input);
  const ts = new Date().toISOString();

  let event: WorklogEvent;
  if (parsed.type === "work_done") {
    event = worklogEventSchema.parse({
      ts,
      type: "work_done",
      actor: parsed.actor,
      summary: parsed.summary,
      files: parsed.files ?? [],
      commit: parsed.commit ?? null,
    });
  } else {
    event = worklogEventSchema.parse({
      ts,
      type: "token_usage",
      actor: parsed.actor,
      model: parsed.model,
      tokensIn: parsed.tokensIn,
      tokensOut: parsed.tokensOut,
      costUsd: parsed.costUsd ?? null,
      runId: parsed.runId ?? null,
    });
  }

  await fs.mkdir(getWorklogsDir(projectRoot), { recursive: true });
  const line = `${JSON.stringify(event)}\n`;
  await fs.appendFile(getWorklogFilePath(projectRoot, taskId), line, "utf8");
  return event;
}

export async function getTokenMetrics(
  projectRoot: string,
  taskId: string,
): Promise<TokenMetrics> {
  const events = await listWorklogEvents(projectRoot, taskId);
  const tokenEvents = events.filter((e) => e.type === "token_usage");

  let tokensIn = 0;
  let tokensOut = 0;
  const byModel: TokenMetrics["byModel"] = {};

  for (const e of tokenEvents) {
    if (e.type !== "token_usage") continue;
    tokensIn += e.tokensIn;
    tokensOut += e.tokensOut;
    if (!byModel[e.model]) {
      byModel[e.model] = { tokensIn: 0, tokensOut: 0, eventCount: 0 };
    }
    byModel[e.model].tokensIn += e.tokensIn;
    byModel[e.model].tokensOut += e.tokensOut;
    byModel[e.model].eventCount += 1;
  }

  return tokenMetricsSchema.parse({
    tokensIn,
    tokensOut,
    totalTokens: tokensIn + tokensOut,
    eventCount: tokenEvents.length,
    byModel,
  });
}
