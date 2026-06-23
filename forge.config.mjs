import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import z from "zod";

/**
 * Set `SKIP_NOTARIZE=true` to build an unsigned, un-notarized app without Apple
 * credentials — used by the `build` script as a CI quality-assurance check.
 * Skipping also disables the env validation below, so CI needs no secrets.
 */
const skipNotarize = process.env.SKIP_NOTARIZE === "true";

export const env = createEnv({
  server: {
    APPLE_ID: z.email(),
    APPLE_ID_PASSWORD: z.string().nonempty(),
    APPLE_TEAM_ID: z.string().nonempty(),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: process.env,
  skipValidation: skipNotarize,
});

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  packagerConfig: {
    name: "Water Warner",
    executableName: "Water Warner",
    icon: "./icons/icon",
    ...(skipNotarize
      ? {}
      : {
          osxSign: {},
          osxNotarize: {
            appleId: env.APPLE_ID,
            appleIdPassword: env.APPLE_ID_PASSWORD,
            teamId: env.APPLE_TEAM_ID,
          },
        }),
  },
  makers: [
    {
      name: "@electron-forge/maker-pkg",
      config: {
        platforms: ["mas"],
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-vite",
      config: {
        build: [
          {
            entry: "src/main.ts",
            config: "vite.main.config.ts",
          },
          {
            entry: "src/preload.ts",
            config: "vite.preload.config.ts",
            target: "preload",
          },
        ],
        renderer: [
          {
            name: "main_window",
            config: "vite.renderer.config.ts",
          },
        ],
      },
    },
  ],
};

export default config;
