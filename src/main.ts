import { app, Menu } from "electron";
import { MenuItem, Tray } from "electron/main";
import { updateElectronApp } from "update-electron-app";
import { z } from "zod";
import { resolve } from "path";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { Temporal } from "temporal-polyfill";
import ms from "ms";
import { printDate } from "./helpers/printDate";
import { seedlingIcon } from "./helpers/seedlingIcon";
import { warningIcon } from "./helpers/warningIcon";
import { safeJsonParse } from "./helpers/safeJsonParse";

/**
 * Auto-update via GitHub releases, using the free update.electronjs.org feed
 * (Squirrel.Mac under the hood). This is a no-op in development and silently
 * does nothing for unsigned builds — Squirrel.Mac only updates signed apps, so
 * updates require a `SIGN=true` release. Checks hourly and prompts the user to
 * restart once a new version has been downloaded.
 */
updateElectronApp({
  repo: "ryami333/water-warner",
  updateInterval: "1 hour",
});

/**
 * Performance improvement:
 * https://www.electronjs.org/docs/latest/tutorial/performance#8-call-menusetapplicationmenunull-when-you-do-not-need-a-default-menu
 */
Menu.setApplicationMenu(null);

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

const APP_DATA_DIRECTORY = resolve(app.getPath("appData"), "water-warner");
const DB_PATH = resolve(APP_DATA_DIRECTORY, "db.json");

interface DB {
  lastWatered: string;
  warningThresholdDays: number;
}

if (!existsSync(APP_DATA_DIRECTORY)) {
  mkdirSync(APP_DATA_DIRECTORY, { recursive: true });
}

if (!existsSync(DB_PATH)) {
  writeFileSync(DB_PATH, "");
}

const initialState: DB = z
  .object({
    lastWatered: z.iso.date(),
    warningThresholdDays: z.number().int(),
  })
  .catch({
    lastWatered: Temporal.Now.plainDateISO().toString(),
    warningThresholdDays: 10,
  })
  .parse(safeJsonParse(readFileSync(DB_PATH, "utf8")));

app
  .whenReady()
  .then(() => {
    const db = new Proxy(initialState, {
      set(...args) {
        const result = Reflect.set(...args);
        sync();
        return result;
      },
    });

    const sync = () => {
      writeFileSync(DB_PATH, JSON.stringify(db));
      build();
    };

    const tray = new Tray(seedlingIcon);

    const build = () => {
      const today = Temporal.Now.plainDateISO();
      const last30Days = Array(30)
        .fill(undefined)
        .map((_, index) => {
          return today.subtract({ days: index });
        });

      const lastWateredPlainDate = Temporal.PlainDate.from(db.lastWatered);

      const daysSinceLastWatered = lastWateredPlainDate.until(today).days;
      tray.setImage(
        daysSinceLastWatered > db.warningThresholdDays
          ? warningIcon
          : seedlingIcon,
      );

      tray.setContextMenu(
        Menu.buildFromTemplate([
          new MenuItem({
            label: `Last watered: ${
              daysSinceLastWatered === 0
                ? "today"
                : `${printDate(
                    lastWateredPlainDate,
                  )} (${daysSinceLastWatered} days ago)`
            }`,
            type: "normal",
            enabled: false,
          }),
          new MenuItem({
            type: "separator",
          }),
          new MenuItem({
            label: "I just watered my plants",
            type: "normal",
            click: () => {
              db.lastWatered = Temporal.Now.plainDateISO().toString();
            },
          }),
          new MenuItem({
            label: "I watered my plants on",
            type: "submenu",
            submenu: Menu.buildFromTemplate(
              last30Days.map((date) => {
                return new MenuItem({
                  type: "radio",
                  label: printDate(date),
                  checked: date.equals(lastWateredPlainDate),
                  click: () => {
                    db.lastWatered = date.toString();
                  },
                });
              }),
            ),
          }),
          new MenuItem({
            type: "separator",
          }),
          new MenuItem({
            type: "submenu",
            label: "Settings",
            submenu: Menu.buildFromTemplate([
              new MenuItem({
                type: "normal",
                label: "Open at login",
                click: () =>
                  app.setLoginItemSettings({
                    openAtLogin: true,
                  }),
              }),
              new MenuItem({
                type: "submenu",
                label: "Warning threshold",
                submenu: Menu.buildFromTemplate(
                  Array(29)
                    .fill(undefined)
                    .map((_, index) => {
                      const days = index + 2;
                      return new MenuItem({
                        type: "normal",
                        label: `${days} days ${
                          db.warningThresholdDays === days ? "✓" : ""
                        }`,
                        click: () => {
                          db.warningThresholdDays = days;
                        },
                      });
                    }),
                ),
              }),
            ]),
          }),
          new MenuItem({
            type: "normal",
            label: "Quit",
            click: () => app.quit(),
          }),
          new MenuItem({
            type: "separator",
          }),
          new MenuItem({
            type: "normal",
            enabled: false,
            label: `Version: ${process.env.commit}`,
          }),
        ]),
      );
    };

    build();

    setInterval(() => build(), ms("2h"));
  })
  .catch(console.error);

app.dock?.hide();

app.setLoginItemSettings({
  openAsHidden: true,
});
