import type { AdminLiveShow, AdminRoll, AdminTitle, AutoSource, ContentType, FilterGroup, Section } from "@/types/catalog";
import { posterSrc } from "./poster";

export interface PreviewItem {
  id: string;
  label: string;
  seed: string;
  src?: string;
}

export interface SectionData {
  titles: AdminTitle[];
  liveShows: AdminLiveShow[];
  rolls: AdminRoll[];
  filters: FilterGroup[];
}

export const AUTO_LABEL: Record<AutoSource, string> = {
  "continue-watching": "Continue watching (per viewer)",
  "live-now": "Live events on air now",
  "upcoming-live": "Upcoming live events",
  replays: "Live replays",
  "latest-rolls": "Latest rolls",
  "top-rated": "Top rated titles",
};

/** Items of a content type as preview tiles. Only approved items reach the site. */
export function contentOf(data: SectionData, type: ContentType): PreviewItem[] {
  if (type === "live") return data.liveShows.filter((show) => show.review.status === "approved").map((show) => ({ id: show.id, label: show.title, seed: show.id }));
  if (type === "roll") return data.rolls.filter((roll) => roll.review.status === "approved").map((roll) => ({ id: roll.id, label: roll.handle, seed: roll.id }));
  return data.titles
    .filter((title) => title.kind === (type === "movie" ? "movie" : "drama") && title.review.status === "approved")
    .map((title) => ({ id: title.id, label: title.title, seed: title.id, src: posterSrc(title) }));
}

/** What a section would show on the site right now. */
export function resolveSection(section: Section, data: SectionData): PreviewItem[] {
  const { source } = section;
  switch (source.type) {
    case "manual": {
      const pool = [...contentOf(data, "movie"), ...contentOf(data, "show"), ...contentOf(data, source.contentType)];
      return source.itemIds.map((id) => pool.find((item) => item.id === id)).filter((item) => item !== undefined);
    }
    case "filter": {
      const tagged = new Set(
        [...data.titles, ...data.liveShows, ...data.rolls].filter((item) => item.filters[source.groupId]?.includes(source.optionId)).map((item) => item.id),
      );
      return contentOf(data, source.contentType).filter((item) => tagged.has(item.id));
    }
    case "group":
      return (data.filters.find((group) => group.id === source.groupId)?.options ?? [])
        .filter((option) => option.active)
        .map((option) => ({ id: option.id, label: option.label, seed: option.id, src: option.imageUrl }));
    case "auto": {
      const live = (status: string) => contentOf(data, "live").filter((item) => data.liveShows.find((show) => show.id === item.id)?.status === status);
      if (source.rule === "live-now") return live("live");
      if (source.rule === "upcoming-live") return live("scheduled");
      if (source.rule === "replays") return live("replay");
      if (source.rule === "latest-rolls") return contentOf(data, "roll");
      if (source.rule === "top-rated") {
        const rated = data.titles.filter((title) => title.rating).sort((a, b) => Number(b.rating) - Number(a.rating));
        const allowed = new Map([...contentOf(data, "movie"), ...contentOf(data, "show")].map((item) => [item.id, item]));
        return rated.map((title) => allowed.get(title.id)).filter((item) => item !== undefined);
      }
      return [];
    }
  }
}
