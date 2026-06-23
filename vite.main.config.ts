import { defineConfig } from "vite";
import { execSync } from "node:child_process";

/**
 * The short commit hash is shown in the tray menu (`process.env.commit` in
 * `src/main.ts`). It is baked in at build time; `"local"` is used when git is
 * unavailable (e.g. running `electron-forge start` outside a checkout).
 */
const commit = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "local";
  }
})();

export default defineConfig({
  resolve: {
    conditions: ["node"],
  },
  define: {
    "process.env.commit": JSON.stringify(commit),
  },
});
