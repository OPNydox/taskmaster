import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import {
  projectConfigSchema,
  type ProjectConfig,
} from "./schemas.js";
import { getConfigPath } from "./paths.js";

export const DEFAULT_CONFIG: ProjectConfig = {
  statuses: [
    { id: "backlog", name: "Backlog", category: "todo" },
    { id: "in_progress", name: "In Progress", category: "in_progress" },
    { id: "in_review", name: "In Review", category: "in_progress" },
    { id: "done", name: "Done", category: "done" },
  ],
  board: {
    columns: ["backlog", "in_progress", "in_review", "done"],
  },
  defaultStatus: "backlog",
};

export async function loadConfig(projectRoot: string): Promise<ProjectConfig> {
  const configPath = getConfigPath(projectRoot);
  const raw = await fs.readFile(configPath, "utf8");
  const parsed = YAML.parse(raw);
  return projectConfigSchema.parse(parsed);
}

export function configToYaml(config: ProjectConfig): string {
  return YAML.stringify(config);
}

export async function configExists(projectRoot: string): Promise<boolean> {
  try {
    await fs.access(getConfigPath(projectRoot));
    return true;
  } catch {
    return false;
  }
}

export function getDefaultStatus(config: ProjectConfig): string {
  return config.defaultStatus ?? config.board.columns[0] ?? "backlog";
}

export function validateStatus(config: ProjectConfig, status: string): boolean {
  return config.statuses.some((s) => s.id === status);
}

export function getStatusName(config: ProjectConfig, statusId: string): string {
  return config.statuses.find((s) => s.id === statusId)?.name ?? statusId;
}
