"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { ProjectConfig, Task, TokenMetrics, WorklogEvent } from "@taskmaster/core";
import { Header } from "@/components/Header";

export default function TaskDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [projectRoot, setProjectRoot] = useState<string | null>(null);
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [events, setEvents] = useState<WorklogEvent[]>([]);
  const [metrics, setMetrics] = useState<TokenMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [agentRunning, setAgentRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "",
    priority: "medium" as Task["priority"],
    type: "task" as Task["type"],
    assignee: "",
    labels: "",
  });

  const load = useCallback(async () => {
    const projRes = await fetch("/api/project");
    const proj = await projRes.json();
    if (!proj.projectRoot) {
      router.replace("/");
      return;
    }
    setProjectRoot(proj.projectRoot);

    const [taskRes, configRes, logRes, metricsRes] = await Promise.all([
      fetch(`/api/tasks/${id}`),
      fetch("/api/config"),
      fetch(`/api/tasks/${id}/worklog`),
      fetch(`/api/tasks/${id}/metrics`),
    ]);

    if (!taskRes.ok) {
      router.replace("/board");
      return;
    }

    const taskData = await taskRes.json();
    const configData = await configRes.json();
    const logData = await logRes.json();
    const metricsData = await metricsRes.json();

    setTask(taskData.task);
    setConfig(configData);
    setEvents(logData.events);
    setMetrics(metricsData.metrics);
    setForm({
      title: taskData.task.title,
      description: taskData.task.description,
      status: taskData.task.status,
      priority: taskData.task.priority,
      type: taskData.task.type,
      assignee: taskData.task.assignee ?? "",
      labels: (taskData.task.labels ?? []).join(", "),
    });
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!task) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        type: form.type,
        assignee: form.assignee || null,
        labels: form.labels
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error ?? "Save failed");
      return;
    }
    setTask(data.task);
    setMessage("Saved");
  }

  async function addNote() {
    if (!note.trim()) return;
    const res = await fetch(`/api/tasks/${id}/worklog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "work_done",
        actor: "user:local",
        summary: note.trim(),
      }),
    });
    if (res.ok) {
      setNote("");
      load();
    }
  }

  async function runAgent() {
    setAgentRunning(true);
    setMessage(null);
    const res = await fetch(`/api/tasks/${id}/run-agent`, { method: "POST" });
    const data = await res.json();
    setAgentRunning(false);
    if (!res.ok) {
      setMessage(data.error ?? "Agent run failed");
      return;
    }
    setMessage(`Agent finished (${data.status}). Run ID: ${data.runId ?? "n/a"}`);
    load();
  }

  if (loading || !task || !config) {
    return (
      <div className="min-h-screen">
        <Header projectRoot={projectRoot} />
        <main className="p-8 text-[var(--muted)]">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header projectRoot={projectRoot} />
      <main className="mx-auto max-w-4xl p-6">
        <Link
          href="/board"
          className="mb-4 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← Back to board
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="text-sm text-[var(--muted)]">{task.id}</span>
            <h1 className="text-2xl font-semibold">{task.title}</h1>
          </div>
          <button
            onClick={runAgent}
            disabled={agentRunning}
            className="shrink-0 rounded-md border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white disabled:opacity-50"
          >
            {agentRunning ? "Running agent…" : "Run agent"}
          </button>
        </div>

        {message && (
          <p className="mb-4 text-sm text-[var(--muted)]">{message}</p>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="font-medium">Details</h2>
            <label className="text-xs text-[var(--muted)]">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <label className="text-xs text-[var(--muted)]">Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={5}
              className="w-full resize-y"
            />
            <label className="text-xs text-[var(--muted)]">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {config.statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-[var(--muted)]">Type</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as Task["type"],
                    })
                  }
                  className="w-full"
                >
                  <option value="task">Task</option>
                  <option value="story">Story</option>
                  <option value="bug">Bug</option>
                  <option value="epic">Epic</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-[var(--muted)]">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value as Task["priority"],
                    })
                  }
                  className="w-full"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <label className="text-xs text-[var(--muted)]">Assignee</label>
            <input
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              placeholder="user:name or agent:session"
            />
            <label className="text-xs text-[var(--muted)]">
              Labels (comma-separated)
            </label>
            <input
              value={form.labels}
              onChange={(e) => setForm({ ...form, labels: e.target.value })}
            />
            <button
              onClick={save}
              disabled={saving}
              className="mt-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </section>

          <div className="flex flex-col gap-6">
            {metrics && (
              <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <h2 className="mb-3 font-medium">Token usage</h2>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-[var(--muted)]">Input</dt>
                  <dd>{metrics.tokensIn.toLocaleString()}</dd>
                  <dt className="text-[var(--muted)]">Output</dt>
                  <dd>{metrics.tokensOut.toLocaleString()}</dd>
                  <dt className="text-[var(--muted)]">Total</dt>
                  <dd>{metrics.totalTokens.toLocaleString()}</dd>
                  <dt className="text-[var(--muted)]">Events</dt>
                  <dd>{metrics.eventCount}</dd>
                </dl>
              </section>
            )}

            <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="mb-3 font-medium">Add work note</h2>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="What did you complete?"
                className="mb-2 w-full"
              />
              <button
                onClick={addNote}
                disabled={!note.trim()}
                className="rounded-md bg-[var(--surface-hover)] px-3 py-1.5 text-sm"
              >
                Add note
              </button>
            </section>

            <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="mb-3 font-medium">Activity</h2>
              {events.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No activity yet.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {events.map((ev, i) => (
                    <li
                      key={`${ev.ts}-${i}`}
                      className="border-l-2 border-[var(--border)] pl-3 text-sm"
                    >
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(ev.ts).toLocaleString()}
                      </span>
                      {ev.type === "work_done" ? (
                        <p>
                          <strong>{ev.actor}</strong>: {ev.summary}
                        </p>
                      ) : (
                        <p>
                          <strong>{ev.actor}</strong> — {ev.model}:{" "}
                          {ev.tokensIn} in / {ev.tokensOut} out
                          {ev.runId && ` (run: ${ev.runId})`}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
