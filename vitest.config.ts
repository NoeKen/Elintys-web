import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.stories.{ts,tsx}",
        "src/app/**/layout.tsx",
        "src/app/**/page.tsx",
        "src/middleware.ts",
      ],
      thresholds: {
        // Plancher global : garde-fou anti-régression sur la couverture actuelle.
        // Objectif final = 100% (voir TESTING.md) ; ce plancher monte à chaque
        // module ajouté à la liste 100% ci-dessous.
        statements: 13,
        branches: 12,
        functions: 8,
        lines: 12,
        // Modules critiques déjà couverts à 100% — ce seuil verrouille leur
        // couverture pour empêcher toute régression future.
        "src/lib/auth/redirects.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/lib/auth/registration-draft.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/server/auth/guards.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/server/auth/session.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/server/auth/cookies.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/features/auth/schemas/index.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/shared/lib/utils.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/shared/lib/format.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/features/auth/components/LoginForm.tsx": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/features/auth/components/RegisterStep1Form.tsx": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/shared/layout/sidebar-nav.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
