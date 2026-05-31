"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

export default function SettingsPage() {
  const [projectRoot, setProjectRoot] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/project"), fetch("/api/settings")]).then(
      async ([p, s]) => {
        const proj = await p.json();
        const settings = await s.json();
        setProjectRoot(proj.projectRoot);
        setApiKey(settings.cursorApiKey ?? "");
      },
    );
  }, []);

  async function saveKey() {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cursorApiKey: apiKey || undefined }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen">
      <Header projectRoot={projectRoot} />
      <main className="mx-auto max-w-lg p-8">
        <h1 className="mb-6 text-2xl font-semibold">Settings</h1>

        <section className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-2 font-medium">Cursor API key (phase 3)</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            Required for &quot;Run agent&quot; on a task. You can also set{" "}
            <code>CURSOR_API_KEY</code> in the environment.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            className="mb-3 w-full"
          />
          <button
            onClick={saveKey}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm"
          >
            Save
          </button>
          {saved && (
            <span className="ml-3 text-sm text-[var(--success)]">Saved</span>
          )}
        </section>

        <section className="text-sm text-[var(--muted)]">
          <p>
            Project path is stored in{" "}
            <code>~/.taskmaster/settings.json</code>
          </p>
          <p className="mt-2">
            Or set <code>TASKMASTER_PROJECT</code> when starting the server.
          </p>
        </section>
      </main>
    </div>
  );
}
