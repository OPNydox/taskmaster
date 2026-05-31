import fs from "node:fs/promises";
import path from "node:path";
import {
  configExists,
  configToYaml,
  DEFAULT_CONFIG,
} from "./config.js";
import { generateTaskId } from "./ids.js";
import {
  getSchemaDir,
  getTaskmasterRoot,
  getTasksDir,
  getWorklogsDir,
  TASKMASTER_DIR,
} from "./paths.js";
import { getTaskJsonSchema, getWorklogJsonSchema } from "./json-schema.js";
import { taskSchema, type Task } from "./schemas.js";
import { createTask } from "./task-store.js";

const AGENTS_MD_TEMPLATE = `# Agent instructions (Taskmaster)

This project uses **Taskmaster** for task tracking. Data lives in \`.taskmaster/\`.

## Paths

- Config & board columns: \`.taskmaster/config.yaml\`
- Tasks: \`.taskmaster/tasks/tm-*.json\`
- Work logs (append-only): \`.taskmaster/worklogs/tm-*.ndjson\`
- JSON Schema: \`.taskmaster/schema/task.schema.json\`, \`worklog.schema.json\`

## Status workflow

Valid statuses: {{STATUSES}}

Default new task status: \`{{DEFAULT_STATUS}}\`

## Rules for agents

1. **Tasks** — Update the task JSON file in place (status, assignee, description). Use hash IDs (\`tm-xxxx\`); do not invent sequential IDs.
2. **Work logs** — **Append only** to \`worklogs/<task-id>.ndjson\`. Never delete or rewrite history.
3. **work_done** — \`{"type":"work_done","actor":"agent:<id>","summary":"...","files":[]}\`
4. **token_usage** — \`{"type":"token_usage","actor":"agent:<id>","model":"...","tokensIn":0,"tokensOut":0,"runId":null}\`

Prefer the Taskmaster MCP tools or REST API when available instead of raw file edits.
`;

export async function initProject(
  projectRoot: string,
  options?: { includeSampleTask?: boolean },
): Promise<{ taskmasterDir: string; sampleTaskId?: string }> {
  const resolved = path.resolve(projectRoot);
  if (await configExists(resolved)) {
    throw new Error(`Taskmaster already initialized at ${resolved}`);
  }

  const root = getTaskmasterRoot(resolved);
  await fs.mkdir(getTasksDir(resolved), { recursive: true });
  await fs.mkdir(getWorklogsDir(resolved), { recursive: true });
  await fs.mkdir(getSchemaDir(resolved), { recursive: true });

  await fs.writeFile(
    path.join(root, "config.yaml"),
    configToYaml(DEFAULT_CONFIG),
    "utf8",
  );

  await fs.writeFile(
    path.join(getSchemaDir(resolved), "task.schema.json"),
    `${JSON.stringify(getTaskJsonSchema(), null, 2)}\n`,
    "utf8",
  );

  await fs.writeFile(
    path.join(getSchemaDir(resolved), "worklog.schema.json"),
    `${JSON.stringify(getWorklogJsonSchema(), null, 2)}\n`,
    "utf8",
  );

  const statuses = DEFAULT_CONFIG.statuses.map((s) => `\`${s.id}\``).join(", ");
  const defaultStatus = DEFAULT_CONFIG.defaultStatus ?? "backlog";
  const agentsContent = AGENTS_MD_TEMPLATE.replace(
    "{{STATUSES}}",
    statuses,
  ).replace("{{DEFAULT_STATUS}}", defaultStatus);

  const agentsPath = path.join(resolved, "AGENTS.md");
  try {
    const existing = await fs.readFile(agentsPath, "utf8");
    if (!existing.includes("Taskmaster")) {
      await fs.appendFile(
        agentsPath,
        `\n\n---\n\n${agentsContent}`,
        "utf8",
      );
    }
  } catch {
    await fs.writeFile(agentsPath, agentsContent, "utf8");
  }

  let sampleTaskId: string | undefined;
  if (options?.includeSampleTask !== false) {
    const task = await createTask(resolved, {
      title: "Welcome to Taskmaster",
      type: "story",
      description:
        "This is a sample task. Drag it across the board or open it to edit.",
      priority: "medium",
    });
    sampleTaskId = task.id;
  }

  return { taskmasterDir: root, sampleTaskId };
}

export { TASKMASTER_DIR, DEFAULT_CONFIG };
