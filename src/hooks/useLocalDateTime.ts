import { useEffect, useState } from "react";
import { resolveTimeZone } from "@/lib/timezones";

export type TimeOfDay = "matin" | "apres-midi" | "soir";

export interface LocalDateTime {
  timeOfDay: TimeOfDay;
  salutation: string;
  formattedDate: string;
  formattedTime: string;
}

function hourInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("fr-FR", { timeZone, hour: "numeric", hourCycle: "h23" }).formatToParts(date);
  const hourPart = parts.find((p) => p.type === "hour");
  return hourPart ? parseInt(hourPart.value, 10) : date.getHours();
}

function resolveTimeOfDay(hour: number): TimeOfDay {
  if (hour < 12) return "matin";
  if (hour < 18) return "apres-midi";
  return "soir";
}

function resolveSalutation(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case "matin":
      return "Bonjour";
    case "apres-midi":
      return "Bon après-midi";
    case "soir":
      return "Bonne soirée";
  }
}

export function useLocalDateTime(countryCode?: string | null): LocalDateTime {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const timeZone = resolveTimeZone(countryCode);
  const timeOfDay = resolveTimeOfDay(hourInTimeZone(now, timeZone));

  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const formattedTime = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  return { timeOfDay, salutation: resolveSalutation(timeOfDay), formattedDate, formattedTime };
}
