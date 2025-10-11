/**
 * @type {import("electron-forge/shared-types").ForgeConfig} config
 */
const config = {
  packagerConfig: {
    name: "Water Warner",
    executableName: "Water Warner",
    icon: "./icons/icon",
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
};

export default config;
