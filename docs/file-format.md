# Taskmaster file format

Task data lives in `.taskmaster/` at the root of each project repository.

## Layout

```
.taskmaster/
  config.yaml
  schema/
    task.schema.json
    worklog.schema.json
  tasks/
    tm-a1b2.json
  worklogs/
    tm-a1b2.ndjson
```

## Task (`tasks/tm-xxxx.json`)

One JSON file per task. IDs use the format `tm-` + 4 hex characters.

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| type | task, story, bug, epic | yes |
| title | string | yes |
| status | string (from config) | yes |
| priority | low, medium, high, critical | yes |
| assignee | string or null | no |
| labels | string[] | yes (default []) |
| parentId | string or null | no |
| description | string | yes (default "") |
| createdAt | ISO 8601 | yes |
| updatedAt | ISO 8601 | yes |

## Worklog (`worklogs/tm-xxxx.ndjson`)

Append-only, one JSON object per line.

### work_done

```json
{"ts":"2026-05-31T14:30:00Z","type":"work_done","actor":"agent:cursor-xyz","summary":"Implemented OAuth","files":["src/auth.ts"],"commit":null}
```

### token_usage

```json
{"ts":"2026-05-31T14:35:00Z","type":"token_usage","actor":"agent:cursor-xyz","model":"composer-2.5","tokensIn":4200,"tokensOut":1100,"costUsd":null,"runId":"run_abc"}
```

## Config (`config.yaml`)

Defines statuses and board columns. See generated file after `init`.

## Agent rules

1. Update task JSON in place for status and metadata.
2. Never rewrite worklog files — only append lines.
3. Use MCP tools or REST API when the Taskmaster server is running.
