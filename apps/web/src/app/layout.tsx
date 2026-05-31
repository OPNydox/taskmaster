import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taskmaster",
  description: "File-backed task board for your repos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
