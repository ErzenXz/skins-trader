"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-56">
        <Header />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
