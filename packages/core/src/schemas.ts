import { z } from "zod";

export const taskTypeSchema = z.enum([
  "task",
  "story",
  "bug",
  "epic",
]);
export type TaskType = z.infer<typeof taskTypeSchema>;

export const prioritySchema = z.enum(["low", "medium", "high", "critical"]);
export type Priority = z.infer<typeof prioritySchema>;

export const taskSchema = z.object({
  id: z.string().regex(/^tm-[a-f0-9]{4}$/),
  type: taskTypeSchema.default("task"),
  title: z.string().min(1),
  status: z.string().min(1),
  priority: prioritySchema.default("medium"),
  assignee: z.string().nullable().optional(),
  labels: z.array(z.string()).default([]),
  parentId: z.string().nullable().optional(),
  description: z.string().default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Task = z.infer<typeof taskSchema>;

export const createTaskInputSchema = z.object({
  title: z.string().min(1),
  type: taskTypeSchema.optional(),
  status: z.string().optional(),
  priority: prioritySchema.optional(),
  assignee: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  parentId: z.string().nullable().optional(),
  description: z.string().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = createTaskInputSchema
  .partial()
  .extend({
    status: z.string().optional(),
  });
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

export const statusCategorySchema = z.enum(["todo", "in_progress", "done"]);

export const statusConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: statusCategorySchema,
});

export const projectConfigSchema = z.object({
  statuses: z.array(statusConfigSchema),
  board: z.object({
    columns: z.array(z.string()),
  }),
  defaultStatus: z.string().optional(),
});
export type ProjectConfig = z.infer<typeof projectConfigSchema>;

export const workDoneEventSchema = z.object({
  ts: z.string().datetime(),
  type: z.literal("work_done"),
  actor: z.string(),
  summary: z.string(),
  files: z.array(z.string()).default([]),
  commit: z.string().nullable().optional(),
});

export const tokenUsageEventSchema = z.object({
  ts: z.string().datetime(),
  type: z.literal("token_usage"),
  actor: z.string(),
  model: z.string(),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  costUsd: z.number().nullable().optional(),
  runId: z.string().nullable().optional(),
});

export const worklogEventSchema = z.discriminatedUnion("type", [
  workDoneEventSchema,
  tokenUsageEventSchema,
]);
export type WorklogEvent = z.infer<typeof worklogEventSchema>;

export const appendWorkDoneSchema = z.object({
  type: z.literal("work_done"),
  actor: z.string(),
  summary: z.string(),
  files: z.array(z.string()).optional(),
  commit: z.string().nullable().optional(),
});

export const appendTokenUsageSchema = z.object({
  type: z.literal("token_usage"),
  actor: z.string(),
  model: z.string(),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  costUsd: z.number().nullable().optional(),
  runId: z.string().nullable().optional(),
});

export const appendWorklogInputSchema = z.discriminatedUnion("type", [
  appendWorkDoneSchema,
  appendTokenUsageSchema,
]);
export type AppendWorklogInput = z.infer<typeof appendWorklogInputSchema>;

export const tokenMetricsSchema = z.object({
  tokensIn: z.number(),
  tokensOut: z.number(),
  totalTokens: z.number(),
  eventCount: z.number(),
  byModel: z.record(
    z.string(),
    z.object({
      tokensIn: z.number(),
      tokensOut: z.number(),
      eventCount: z.number(),
    }),
  ),
});
export type TokenMetrics = z.infer<typeof tokenMetricsSchema>;
