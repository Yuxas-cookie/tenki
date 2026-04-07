"use client";

import { useState } from "react";
import { Sidebar, MobileHeader } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-72 min-h-screen">
        <MobileHeader onOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50/80">
          <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
