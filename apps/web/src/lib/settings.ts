import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export interface AppSettings {
  projectRoot: string | null;
  recentProjects: string[];
  cursorApiKey?: string;
}

const SETTINGS_DIR = path.join(os.homedir(), ".taskmaster");
const SETTINGS_FILE = path.join(SETTINGS_DIR, "settings.json");

const DEFAULT_SETTINGS: AppSettings = {
  projectRoot: process.env.TASKMASTER_PROJECT ?? null,
  recentProjects: [],
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await fs.mkdir(SETTINGS_DIR, { recursive: true });
  await fs.writeFile(
    SETTINGS_FILE,
    `${JSON.stringify(settings, null, 2)}\n`,
    "utf8",
  );
}

export async function setProjectRoot(projectRoot: string): Promise<AppSettings> {
  const settings = await loadSettings();
  const normalized = path.resolve(projectRoot);
  const recent = [
    normalized,
    ...settings.recentProjects.filter((p) => p !== normalized),
  ].slice(0, 10);
  const updated: AppSettings = {
    ...settings,
    projectRoot: normalized,
    recentProjects: recent,
  };
  await saveSettings(updated);
  return updated;
}

export async function getProjectRoot(): Promise<string | null> {
  const settings = await loadSettings();
  return settings.projectRoot ?? process.env.TASKMASTER_PROJECT ?? null;
}
