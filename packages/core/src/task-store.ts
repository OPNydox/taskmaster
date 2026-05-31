import fs from "node:fs/promises";
import path from "node:path";
import {
  configExists,
  getDefaultStatus,
  loadConfig,
  validateStatus,
} from "./config.js";
import { generateTaskId } from "./ids.js";
import { getTaskFilePath, getTasksDir } from "./paths.js";
import {
  createTaskInputSchema,
  taskSchema,
  updateTaskInputSchema,
  type CreateTaskInput,
  type Task,
  type UpdateTaskInput,
} from "./schemas.js";

export class TaskmasterNotInitializedError extends Error {
  constructor(projectRoot: string) {
    super(`Taskmaster is not initialized at ${projectRoot}`);
    this.name = "TaskmasterNotInitializedError";
  }
}

export interface ListTasksResult {
  tasks: Task[];
  warnings: string[];
}

async function ensureInitialized(projectRoot: string): Promise<void> {
  if (!(await configExists(projectRoot))) {
    throw new TaskmasterNotInitializedError(projectRoot);
  }
}

function parseTaskFromRaw(
  raw: string,
  fileName: string,
): { task?: Task; warning?: string } {
  try {
    return { task: taskSchema.parse(JSON.parse(raw)) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid task file";
    return { warning: `Skipped ${fileName}: ${message}` };
  }
}

export async function listTasksWithWarnings(
  projectRoot: string,
): Promise<ListTasksResult> {
  await ensureInitialized(projectRoot);
  const tasksDir = getTasksDir(projectRoot);
  let entries: string[];
  try {
    entries = await fs.readdir(tasksDir);
  } catch {
    return { tasks: [], warnings: [] };
  }

  const tasks: Task[] = [];
  const warnings: string[] = [];
  for (const file of entries) {
    if (!file.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(tasksDir, file), "utf8");
    const parsed = parseTaskFromRaw(raw, file);
    if (parsed.task) {
      tasks.push(parsed.task);
    } else if (parsed.warning) {
      warnings.push(parsed.warning);
    }
  }

  tasks.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return { tasks, warnings };
}

export async function listTasks(projectRoot: string): Promise<Task[]> {
  const { tasks } = await listTasksWithWarnings(projectRoot);
  return tasks;
}

export async function getTask(
  projectRoot: string,
  taskId: string,
): Promise<Task | null> {
  await ensureInitialized(projectRoot);
  const filePath = getTaskFilePath(projectRoot, taskId);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = parseTaskFromRaw(raw, `${taskId}.json`);
    return parsed.task ?? null;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    return null;
  }
}

export async function createTask(
  projectRoot: string,
  input: CreateTaskInput,
): Promise<Task> {
  await ensureInitialized(projectRoot);
  const parsed = createTaskInputSchema.parse(input);
  const config = await loadConfig(projectRoot);
  const now = new Date().toISOString();
  const status =
    parsed.status && validateStatus(config, parsed.status)
      ? parsed.status
      : getDefaultStatus(config);

  const task: Task = taskSchema.parse({
    id: generateTaskId(),
    type: parsed.type ?? "task",
    title: parsed.title,
    status,
    priority: parsed.priority ?? "medium",
    assignee: parsed.assignee ?? null,
    labels: parsed.labels ?? [],
    parentId: parsed.parentId ?? null,
    description: parsed.description ?? "",
    createdAt: now,
    updatedAt: now,
  });

  await fs.mkdir(getTasksDir(projectRoot), { recursive: true });
  await fs.writeFile(
    getTaskFilePath(projectRoot, task.id),
    `${JSON.stringify(task, null, 2)}\n`,
    "utf8",
  );
  return task;
}

export async function updateTask(
  projectRoot: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task> {
  await ensureInitialized(projectRoot);
  const parsed = updateTaskInputSchema.parse(input);
  const existing = await getTask(projectRoot, taskId);
  if (!existing) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const config = await loadConfig(projectRoot);
  if (parsed.status && !validateStatus(config, parsed.status)) {
    throw new Error(`Invalid status: ${parsed.status}`);
  }

  const updated: Task = taskSchema.parse({
    ...existing,
    ...parsed,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  });

  await fs.writeFile(
    getTaskFilePath(projectRoot, taskId),
    `${JSON.stringify(updated, null, 2)}\n`,
    "utf8",
  );
  return updated;
}

export async function deleteTask(
  projectRoot: string,
  taskId: string,
): Promise<void> {
  await ensureInitialized(projectRoot);
  await fs.unlink(getTaskFilePath(projectRoot, taskId));
}
