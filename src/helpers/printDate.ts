import { format } from "date-fns";
import { Temporal } from "temporal-polyfill";

export const printDate = (date: Temporal.PlainDate) => {
  // date-fns formats a JS Date, so project the plain date onto the local
  // calendar day (no time/zone) purely for display.
  return format(
    new Date(date.year, date.month - 1, date.day),
    "E do MMM" /* Mon 1st Jan */,
  );
};
