import type { LiveShowStatus } from "@/types/catalog";

const IST = "Asia/Kolkata";

export function formatShowTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/** ISO → "YYYY-MM-DDTHH:mm" in IST, for <input type="datetime-local">. */
export function toISTInput(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function fromISTInput(value: string): string {
  return `${value}:00+05:30`;
}

/** The forward step admins can take from each status (roll-now-api/docs/live-shows-flow.md §13). */
export const NEXT_STEP: Partial<Record<LiveShowStatus, { label: string; to: LiveShowStatus }>> = {
  draft: { label: "Schedule", to: "scheduled" },
  scheduled: { label: "Go live", to: "live" },
  live: { label: "End show", to: "ended" },
  ended: { label: "Publish replay", to: "replay" },
};

export const STATUS_LABEL: Record<LiveShowStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  live: "Live",
  ended: "Ended",
  replay: "Replay",
  cancelled: "Cancelled",
};
