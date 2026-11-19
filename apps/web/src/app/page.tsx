"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../components/layout/Topbar";
import { LeftRail } from "../components/layout/LeftRail";
import { WelcomeScreen } from "../components/welcome/WelcomeScreen";
import { BackendCanvas } from "../components/canvas/BackendCanvas";
import { RightInspector } from "../components/inspector/RightInspector";
import { ImportModal } from "../components/importer/ImportModal";
import { PreviewDrawer } from "../components/preview/PreviewDrawer";
import { useProjectStore } from "../store/useProjectStore";

export default function HomePage() {
  const theme = useProjectStore((s) => s.theme);
  const ir = useProjectStore((s) => s.ir);
  const activeTab = useProjectStore((s) => s.activeTab);

  // Sync theme with html data-theme attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const hasEntities = ir.entities.length > 0;
  const isCanvasActive = hasEntities && activeTab === "model";

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <LeftRail />
        <main className="flex-1 flex overflow-hidden relative">
          {isCanvasActive ? (
            <div className="flex-1 flex overflow-hidden relative">
              <BackendCanvas />
              <RightInspector />
            </div>
          ) : (
            <WelcomeScreen />
          )}
        </main>
      </div>
      <ImportModal />
      <PreviewDrawer />
    </div>
  );
}
