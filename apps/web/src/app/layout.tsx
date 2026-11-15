import type { Metadata } from "next";
import "../styles/globals.css";
import { APP_NAME } from "../config/brand";

export const metadata: Metadata = {
  title: `${APP_NAME} — Visual Schema & Backend Architecture Studio`,
  description: "Synthesize relational and document backends with zero-drift code generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-canvas text-txt-primary flex flex-col">
        {children}
      </body>
    </html>
  );
}
