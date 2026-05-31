"use client";

import { useState } from "react";
import type { Task } from "@taskmaster/core";

interface CreateTaskModalProps {
  defaultStatus: string;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export function CreateTaskModal({
  defaultStatus,
  onClose,
  onCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"task" | "story" | "bug" | "epic">("task");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "critical"
  >("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        type,
        priority,
        status: defaultStatus,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to create");
      return;
    }
    onCreated(data.task);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">New task</h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            autoFocus
            className="w-full"
          />
          <div className="flex gap-3">
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as "task" | "story" | "bug" | "epic")
              }
            >
              <option value="task">Task</option>
              <option value="story">Story</option>
              <option value="bug">Bug</option>
              <option value="epic">Epic</option>
            </select>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(
                  e.target.value as "low" | "medium" | "high" | "critical",
                )
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          {error && (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium"
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
