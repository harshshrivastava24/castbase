"use client";

import React, { useEffect } from "react";
import { Topbar } from "../components/layout/Topbar";
import { LeftRail } from "../components/layout/LeftRail";
import { WelcomeScreen } from "../components/welcome/WelcomeScreen";
import { ImportModal } from "../components/importer/ImportModal";
import { useProjectStore } from "../store/useProjectStore";

export default function HomePage() {
  const theme = useProjectStore((s) => s.theme);
  const setTheme = useProjectStore((s) => s.setTheme);

  // Sync theme with html data-theme attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <LeftRail />
        <main className="flex-1 flex overflow-hidden relative">
          <WelcomeScreen />
        </main>
      </div>
      <ImportModal />
    </div>
  );
}
