import type { BadgeTone } from "@/components/ui";
import type { CastMember, ContentType, FilterGroup, FilterValues, ReviewStatus, RuleSeverity } from "@/types/catalog";

export const CONTENT_LABEL: Record<ContentType, string> = { movie: "Movie", show: "Show", live: "Live event", roll: "Roll" };
export const CONTENT_PLURAL: Record<ContentType, string> = { movie: "Movies", show: "Shows", live: "Live events", roll: "Rolls" };

export const REVIEW_TONE: Record<ReviewStatus, BadgeTone> = { pending: "warning", approved: "success", rejected: "danger" };
export const SEVERITY_TONE: Record<RuleSeverity, BadgeTone> = { low: "neutral", medium: "warning", high: "accent", critical: "danger" };

export const groupsFor = (groups: FilterGroup[], type: ContentType) => groups.filter((group) => group.appliesTo.includes(type));

/** Selected option labels of one filter group, e.g. ["Hindi", "Tamil"]. */
export function filterLabels(groups: FilterGroup[], values: FilterValues, groupId: string): string[] {
  const group = groups.find((candidate) => candidate.id === groupId);
  return (values[groupId] ?? []).map((id) => group?.options.find((option) => option.id === id)?.label).filter((label) => label !== undefined);
}

/** The site-facing fields of a title that come from filters (site's Title.languages / Title.cast). */
export function siteFieldsFromFilters(groups: FilterGroup[], values: FilterValues): { languages?: string[]; cast?: CastMember[] } {
  const languages = filterLabels(groups, values, "language");
  const actors = groups.find((group) => group.id === "actors");
  const cast = (values.actors ?? [])
    .map((id) => actors?.options.find((option) => option.id === id))
    .filter((option) => option !== undefined)
    .map((option) => ({ id: option.id, name: option.label, cardImageUrl: option.imageUrl }));
  return { languages: languages.length ? languages : undefined, cast: cast.length ? cast : undefined };
}

export const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";
