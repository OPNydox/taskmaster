"use client";

import Link from "next/link";
import type { Task } from "@taskmaster/core";

const priorityColors: Record<string, string> = {
  low: "text-[var(--muted)]",
  medium: "text-[var(--text)]",
  high: "text-[var(--warning)]",
  critical: "text-[var(--danger)]",
};

interface TaskCardProps {
  task: Task;
  dragging?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export function TaskCard({
  task,
  dragging,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 cursor-grab active:cursor-grabbing ${
        dragging ? "opacity-50" : ""
      }`}
    >
      <Link href={`/tasks/${task.id}`} className="block hover:text-[var(--accent)]">
        <p className="font-medium text-sm leading-snug">{task.title}</p>
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span className={priorityColors[task.priority] ?? ""}>
          {task.priority}
        </span>
        <span>{task.type}</span>
        {task.assignee && (
          <span className="truncate max-w-[120px]" title={task.assignee}>
            {task.assignee}
          </span>
        )}
      </div>
      {task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span
              key={l}
              className="rounded bg-[var(--surface-hover)] px-1.5 py-0.5 text-xs"
            >
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
