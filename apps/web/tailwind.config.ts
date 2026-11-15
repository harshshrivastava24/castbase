import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        surface: {
          DEFAULT: "var(--bg-surface)",
          elevated: "var(--bg-surface-elevated)",
        },
        inspector: "var(--bg-inspector)",
        footer: "var(--bg-footer)",
        txt: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        border: {
          subtle: "var(--border-subtle)",
          focus: "var(--border-focus)",
        },
        accent: {
          primary: "var(--accent-primary)",
          "primary-fg": "var(--accent-primary-fg)",
          secondary: "var(--accent-secondary)",
          danger: "var(--accent-danger)",
        },
        entity: {
          lime: "var(--entity-lime)",
          coral: "var(--entity-coral)",
          teal: "var(--entity-teal)",
          amber: "var(--entity-amber)",
          violet: "var(--entity-violet)",
          sky: "var(--entity-sky)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Geist Mono", "monospace"],
      },
      boxShadow: {
        node: "var(--shadow-node)",
        selected: "var(--shadow-selected)",
      },
    },
  },
  plugins: [],
};

export default config;
