"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectConfig, Task } from "@taskmaster/core";
import { Header } from "@/components/Header";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskModal } from "@/components/CreateTaskModal";

export default function BoardPage() {
  const router = useRouter();
  const [projectRoot, setProjectRoot] = useState<string | null>(null);
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const projRes = await fetch("/api/project");
    const proj = await projRes.json();
    if (!proj.projectRoot || !proj.initialized) {
      router.replace("/");
      return;
    }
    setProjectRoot(proj.projectRoot);

    const [configRes, tasksRes] = await Promise.all([
      fetch("/api/config"),
      fetch("/api/tasks"),
    ]);

    if (!configRes.ok) {
      const data = await configRes.json().catch(() => ({}));
      setLoadError(data.error ?? "Failed to load project config");
      setLoading(false);
      return;
    }

    if (!tasksRes.ok) {
      const data = await tasksRes.json().catch(() => ({}));
      setLoadError(data.error ?? "Failed to load tasks");
      setLoading(false);
      return;
    }

    const configData = await configRes.json();
    const tasksData = await tasksRes.json();
    setConfig(configData);
    setTasks(tasksData.tasks);
    setWarnings(tasksData.warnings ?? []);
    setLoadError(null);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function moveTask(taskId: string, status: string) {
    const prev = tasks;
    setTasks((t) =>
      t.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setTasks(prev);
    } else {
      const data = await res.json();
      setTasks((t) =>
        t.map((task) => (task.id === taskId ? data.task : task)),
      );
    }
  }

  function tasksForColumn(statusId: string) {
    return tasks.filter((t) => t.status === statusId);
  }

  if (loading || !config) {
    return (
      <div className="min-h-screen">
        <Header projectRoot={projectRoot} />
        <main className="p-8">
          {loadError ? (
            <p className="text-sm text-[var(--danger)]">{loadError}</p>
          ) : (
            <p className="text-[var(--muted)]">Loading board…</p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header projectRoot={projectRoot} />
      <div className="flex items-center justify-between px-6 py-3">
        <h1 className="text-xl font-semibold">Board</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)]"
        >
          + New task
        </button>
      </div>

      {warnings.length > 0 && (
        <div className="mx-6 mb-3 rounded-md border border-[var(--warning)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--warning)]">
          <p className="font-medium">Some task files could not be loaded:</p>
          <ul className="mt-1 list-inside list-disc">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-x-auto px-6 pb-6">
        {config.board.columns.map((colId) => {
          const status = config.statuses.find((s) => s.id === colId);
          const label = status?.name ?? colId;
          return (
            <div
              key={colId}
              className="flex min-w-[260px] flex-1 flex-col rounded-lg bg-[var(--surface)]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData("taskId");
                if (taskId) moveTask(taskId, colId);
                setDraggingId(null);
              }}
            >
              <div className="border-b border-[var(--border)] px-4 py-3 font-medium text-sm">
                {label}
                <span className="ml-2 text-[var(--muted)]">
                  {tasksForColumn(colId).length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3 min-h-[120px]">
                {tasksForColumn(colId).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    dragging={draggingId === task.id}
                    onDragStart={() => setDraggingId(task.id)}
                    onDragEnd={() => setDraggingId(null)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <CreateTaskModal
          defaultStatus={config.defaultStatus ?? config.board.columns[0]}
          onClose={() => setShowCreate(false)}
          onCreated={(task) => {
            setTasks((t) => [task, ...t]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
