"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";

interface ProjectState {
  projectRoot: string | null;
  initialized: boolean;
  recentProjects: string[];
}

export default function HomePage() {
  const router = useRouter();
  const [path, setPath] = useState("");
  const [state, setState] = useState<ProjectState>({
    projectRoot: null,
    initialized: false,
    recentProjects: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(false);

  const refresh = useCallback(async () => {
    const [projRes, settingsRes] = await Promise.all([
      fetch("/api/project"),
      fetch("/api/settings"),
    ]);
    const proj = await projRes.json();
    const settings = await settingsRes.json();
    setState({
      projectRoot: proj.projectRoot,
      initialized: proj.initialized,
      recentProjects: settings.recentProjects ?? [],
    });
    if (proj.projectRoot) setPath(proj.projectRoot);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function openProject(projectPath: string) {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectPath }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to open project");
      return;
    }
    setState({
      projectRoot: data.projectRoot,
      initialized: data.initialized,
      recentProjects: data.recentProjects,
    });
    if (data.initialized) {
      router.push("/board");
    }
  }

  async function initializeProject() {
    setInitLoading(true);
    setError(null);
    const res = await fetch("/api/project", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "init" }),
    });
    const data = await res.json();
    setInitLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Init failed");
      return;
    }
    router.push("/board");
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="p-8 text-[var(--muted)]">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header projectRoot={state.projectRoot} />
      <main className="mx-auto max-w-xl p-8">
        <h1 className="mb-2 text-2xl font-semibold">Open a project</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Enter the absolute path to a repository. Taskmaster stores tasks in{" "}
          <code className="text-[var(--accent)]">.taskmaster/</code> inside that
          repo.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            openProject(path);
          }}
          className="flex flex-col gap-3"
        >
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="D:\dev\my-project"
            className="w-full"
          />
          <button
            type="submit"
            className="rounded-md bg-[var(--accent)] px-4 py-2 font-medium hover:bg-[var(--accent-hover)]"
          >
            Open project
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
        )}

        {state.projectRoot && !state.initialized && (
          <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="mb-2 font-medium">Initialize Taskmaster</h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              No <code>.taskmaster/</code> found. Create the default board and
              sample task?
            </p>
            <button
              onClick={initializeProject}
              disabled={initLoading}
              className="rounded-md bg-[var(--success)] px-4 py-2 text-sm font-medium text-[#0f1419]"
            >
              {initLoading ? "Initializing…" : "Initialize"}
            </button>
          </div>
        )}

        {state.recentProjects.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">
              Recent projects
            </h2>
            <ul className="flex flex-col gap-2">
              {state.recentProjects.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => openProject(p)}
                    className="w-full truncate rounded-md border border-[var(--border)] px-3 py-2 text-left text-sm hover:bg-[var(--surface-hover)]"
                    title={p}
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
