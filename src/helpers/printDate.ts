import { app } from "electron";
import { Temporal } from "temporal-polyfill";

export function printDate(date: Temporal.PlainDate) {
  return date.toLocaleString(app.getLocale(), {
    dateStyle: "short",
  });
}
