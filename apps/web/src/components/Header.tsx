"use client";

import Link from "next/link";

interface HeaderProps {
  projectRoot?: string | null;
}

export function Header({ projectRoot }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-lg font-semibold text-[var(--accent)]">
          Taskmaster
        </Link>
        {projectRoot && (
          <span
            className="max-w-md truncate text-sm text-[var(--muted)]"
            title={projectRoot}
          >
            {projectRoot}
          </span>
        )}
      </div>
      <nav className="flex gap-4 text-sm">
        {projectRoot && (
          <>
            <Link href="/board" className="hover:text-[var(--accent)]">
              Board
            </Link>
            <Link href="/settings" className="hover:text-[var(--accent)]">
              Settings
            </Link>
          </>
        )}
        <Link href="/" className="hover:text-[var(--accent)]">
          Projects
        </Link>
      </nav>
    </header>
  );
}
