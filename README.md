# Taskmaster

File-backed, Jira-style task board for your repositories. Tasks live in `.taskmaster/` inside each project and are versioned with Git.

## Features

- Kanban board with drag-and-drop status changes
- Per-project `.taskmaster/` storage (JSON tasks + NDJSON work logs)
- Token usage and work completion tracking per task
- MCP server for Cursor agents
- Optional "Run agent" via Cursor SDK

## Requirements

- Node.js 20+
- pnpm 9+

## Quick start

```bash
pnpm install
pnpm build
pnpm dev
```

Open http://localhost:3000, enter the absolute path to a project repo, and click **Initialize** if `.taskmaster/` does not exist.

### Environment

| Variable | Description |
|----------|-------------|
| `TASKMASTER_PROJECT` | Default project root path |
| `CURSOR_API_KEY` | For "Run agent" on task detail (or save in Settings) |

## MCP server (agents)

Build and run with `TASKMASTER_PROJECT` set to your repo:

```bash
pnpm build
TASKMASTER_PROJECT=D:\dev\my-project pnpm mcp
```

Add to Cursor MCP config:

```json
{
  "mcpServers": {
    "taskmaster": {
      "command": "node",
      "args": ["path/to/taskmaster/packages/mcp/dist/index.js"],
      "env": {
        "TASKMASTER_PROJECT": "D:\\dev\\my-project"
      }
    }
  }
}
```

### Tools

- `task_list`, `task_get`, `task_create`, `task_update`
- `worklog_append`, `task_token_summary`
- `project_init`

## REST API

When the web app is running:

- `GET/POST /api/tasks`
- `GET/PATCH/DELETE /api/tasks/:id`
- `GET/POST /api/tasks/:id/worklog`
- `GET /api/tasks/:id/metrics`
- `POST /api/tasks/:id/run-agent`
- `GET/POST/PUT /api/project`

## Docs

See [docs/file-format.md](docs/file-format.md) for the on-disk schema.

## Monorepo

- `packages/core` — file store, schemas, init
- `apps/web` — Next.js UI + API
- `packages/mcp` — MCP server for agents
