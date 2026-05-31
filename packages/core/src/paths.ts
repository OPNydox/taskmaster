import path from "node:path";

export const TASKMASTER_DIR = ".taskmaster";

export function getTaskmasterRoot(projectRoot: string): string {
  return path.join(projectRoot, TASKMASTER_DIR);
}

export function getConfigPath(projectRoot: string): string {
  return path.join(getTaskmasterRoot(projectRoot), "config.yaml");
}

export function getTasksDir(projectRoot: string): string {
  return path.join(getTaskmasterRoot(projectRoot), "tasks");
}

export function getWorklogsDir(projectRoot: string): string {
  return path.join(getTaskmasterRoot(projectRoot), "worklogs");
}

export function getSchemaDir(projectRoot: string): string {
  return path.join(getTaskmasterRoot(projectRoot), "schema");
}

export function getTaskFilePath(projectRoot: string, taskId: string): string {
  return path.join(getTasksDir(projectRoot), `${taskId}.json`);
}

export function getWorklogFilePath(projectRoot: string, taskId: string): string {
  return path.join(getWorklogsDir(projectRoot), `${taskId}.ndjson`);
}

export function isInitialized(projectRoot: string): boolean {
  return getConfigPath(projectRoot).length > 0;
}
