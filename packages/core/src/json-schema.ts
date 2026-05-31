import { zodToJsonSchema } from "zod-to-json-schema";
import {
  taskSchema,
  worklogEventSchema,
} from "./schemas.js";

export function getTaskJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(taskSchema, {
    name: "Task",
    $refStrategy: "none",
  }) as Record<string, unknown>;
}

export function getWorklogJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(worklogEventSchema, {
    name: "WorklogEvent",
    $refStrategy: "none",
  }) as Record<string, unknown>;
}
