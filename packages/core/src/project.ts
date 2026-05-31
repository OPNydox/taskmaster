import { configExists } from "./config.js";
import { TASKMASTER_DIR } from "./paths.js";

export async function isProjectInitialized(
  projectRoot: string,
): Promise<boolean> {
  return configExists(projectRoot);
}

export { TASKMASTER_DIR };
