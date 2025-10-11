import { app, Menu } from "electron";
import { MenuItem, Tray } from "electron/main";
import { z } from "zod";
import { resolve } from "path";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { addDays, differenceInCalendarDays } from "date-fns";
import ms from "ms";
import { printDate } from "./helpers/printDate";
import { seedlingIcon } from "./helpers/seedlingIcon";
import { warningIcon } from "./helpers/warningIcon";
import { safeJsonParse } from "./helpers/safeJsonParse";

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
  lastWatered: Date;
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
    lastWatered: z
      .string()
      .datetime()
      .transform((str) => new Date(str)),
    warningThresholdDays: z.number().int(),
  })
  .catch({
    lastWatered: new Date(),
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
      const today = new Date();
      const last30Days = Array(30)
        .fill(undefined)
        .map((_, index) => {
          return addDays(today, -1 * index);
        });

      const daysSinceLastWatered = differenceInCalendarDays(
        new Date(),
        db.lastWatered,
      );
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
                    db.lastWatered,
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
              db.lastWatered = new Date();
            },
          }),
          new MenuItem({
            label: "I watered my plants on",
            type: "submenu",
            submenu: Menu.buildFromTemplate(
              last30Days.map((date) => {
                return new MenuItem({
                  type: "normal",
                  label: printDate(date),
                  click: () => {
                    db.lastWatered = date;
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
