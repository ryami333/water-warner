import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import z from "zod";

const env = createEnv({
  server: {
    SIGN: z.stringbool().optional().default(false),
  },
  runtimeEnv: process.env,
});

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  hooks: {
    resolveForgeConfig: (runConfig) => {
      if (env.SIGN === "true") {
        const notarizeEnv = createEnv({
          server: {
            APPLE_ID: z.email(),
            APPLE_ID_PASSWORD: z.string().nonempty(),
            APPLE_TEAM_ID: z.string().nonempty(),
          },
          runtimeEnv: process.env,
          skipValidation: true,
        });

        runConfig.packagerConfig.osxSign = {};
        runConfig.packagerConfig.osxNotarize = {
          appleId: notarizeEnv.APPLE_ID,
          appleIdPassword: notarizeEnv.APPLE_ID_PASSWORD,
          teamId: notarizeEnv.APPLE_TEAM_ID,
        };
      }
      return runConfig;
    },
  },
  packagerConfig: {
    name: "mtask",
    executableName: "mtask",
    icon: "./icons/icon",
  },
  makers: [
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
        // Tray-only app: no BrowserWindow, so there is no renderer to build.
        renderer: [],
      },
    },
  ],
};

export default config;
