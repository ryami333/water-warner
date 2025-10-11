import { format } from "date-fns";

export const printDate = (date: Date) => {
  return format(date, "E do MMM" /* Mon 1st Jan */);
};
