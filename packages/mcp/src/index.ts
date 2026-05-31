#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  appendWorklog,
  createTask,
  getTask,
  getTokenMetrics,
  initProject,
  isProjectInitialized,
  listTasks,
  listWorklogEvents,
  updateTask,
} from "@taskmaster/core";

function getProjectRoot(): string {
  const root = process.env.TASKMASTER_PROJECT;
  if (!root) {
    throw new Error(
      "TASKMASTER_PROJECT environment variable must point to the target repo root",
    );
  }
  return root;
}

const server = new McpServer({
  name: "taskmaster",
  version: "0.1.0",
});

server.tool(
  "task_list",
  "List all tasks in the current project",
  {},
  async () => {
    const projectRoot = getProjectRoot();
    const tasks = await listTasks(projectRoot);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ tasks }, null, 2),
        },
      ],
    };
  },
);

server.tool(
  "task_get",
  "Get a single task by ID",
  { taskId: z.string() },
  async ({ taskId }) => {
    const projectRoot = getProjectRoot();
    const task = await getTask(projectRoot, taskId);
    if (!task) {
      return {
        content: [{ type: "text" as const, text: `Task not found: ${taskId}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ task }, null, 2) }],
    };
  },
);

server.tool(
  "task_create",
  "Create a new task",
  {
    title: z.string(),
    type: z.enum(["task", "story", "bug", "epic"]).optional(),
    status: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    description: z.string().optional(),
    assignee: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
  },
  async (input) => {
    const projectRoot = getProjectRoot();
    const task = await createTask(projectRoot, input);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ task }, null, 2) }],
    };
  },
);

server.tool(
  "task_update",
  "Update an existing task",
  {
    taskId: z.string(),
    title: z.string().optional(),
    status: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    description: z.string().optional(),
    assignee: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
  },
  async ({ taskId, ...input }) => {
    const projectRoot = getProjectRoot();
    const task = await updateTask(projectRoot, taskId, input);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ task }, null, 2) }],
    };
  },
);

server.tool(
  "worklog_append",
  "Append a work_done or token_usage event to a task worklog",
  {
    taskId: z.string(),
    type: z.enum(["work_done", "token_usage"]),
    actor: z.string(),
    summary: z.string().optional(),
    files: z.array(z.string()).optional(),
    model: z.string().optional(),
    tokensIn: z.number().optional(),
    tokensOut: z.number().optional(),
    runId: z.string().nullable().optional(),
  },
  async (input) => {
    const projectRoot = getProjectRoot();
    const { taskId, type, actor, ...rest } = input;

    if (type === "work_done") {
      if (!rest.summary) {
        return {
          content: [{ type: "text" as const, text: "summary required for work_done" }],
          isError: true,
        };
      }
      const event = await appendWorklog(projectRoot, taskId, {
        type: "work_done",
        actor,
        summary: rest.summary,
        files: rest.files,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ event }, null, 2) }],
      };
    }

    const event = await appendWorklog(projectRoot, taskId, {
      type: "token_usage",
      actor,
      model: rest.model ?? "unknown",
      tokensIn: rest.tokensIn ?? 0,
      tokensOut: rest.tokensOut ?? 0,
      runId: rest.runId ?? null,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ event }, null, 2) }],
    };
  },
);

server.tool(
  "task_token_summary",
  "Get aggregated token usage metrics for a task",
  { taskId: z.string() },
  async ({ taskId }) => {
    const projectRoot = getProjectRoot();
    const metrics = await getTokenMetrics(projectRoot, taskId);
    const events = await listWorklogEvents(projectRoot, taskId);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ metrics, eventCount: events.length }, null, 2),
        },
      ],
    };
  },
);

server.tool(
  "project_init",
  "Initialize .taskmaster/ in the project (if not already initialized)",
  { includeSampleTask: z.boolean().optional() },
  async ({ includeSampleTask }) => {
    const projectRoot = getProjectRoot();
    if (await isProjectInitialized(projectRoot)) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ message: "Already initialized" }),
          },
        ],
      };
    }
    const result = await initProject(projectRoot, { includeSampleTask });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
