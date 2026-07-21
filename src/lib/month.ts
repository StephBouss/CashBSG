import { endOfMonth, formatISO, startOfMonth } from "date-fns";

export interface MonthRange {
  start: string;
  end: string;
}

export function monthRange(reference: Date = new Date()): MonthRange {
  return {
    start: formatISO(startOfMonth(reference), { representation: "date" }),
    end: formatISO(endOfMonth(reference), { representation: "date" }),
  };
}
