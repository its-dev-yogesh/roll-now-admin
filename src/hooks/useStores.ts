/**
 * Every admin collection, loaded from the API (roll-now-api) and held in memory only.
 * Each maps between the admin's shapes (src/types/catalog.ts) and the API's DTOs.
 */
import { api } from "@/lib/api";
import type {
  AdminLiveShow,
  AdminRoll,
  AdminTitle,
  AdminUser,
  Booking,
  ContentType,
  FilterGroup,
  FilterValues,
  Review,
  ReviewStatus,
  Role,
  Rule,
  Section,
  SectionSource,
} from "@/types/catalog";
import { createResource } from "./resource";

/* ───────── shared ───────── */

interface ApiReview {
  status: ReviewStatus;
  passedRuleIds: string[];
  note: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

const toReview = (status: ReviewStatus, row?: ApiReview | null): Review => ({
  status,
  passedRuleIds: row?.passedRuleIds ?? [],
  note: row?.note ?? undefined,
  reviewedBy: row?.reviewedBy ?? undefined,
  reviewedAt: row?.reviewedAt ?? undefined,
});

const compact = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : String(n));
const orUndefined = <T>(value: T | null) => value ?? undefined;
const text = (value?: string) => (value?.trim() ? value.trim() : undefined);

/* ───────── titles (movies & shows) ───────── */

interface ApiTitle {
  id: string;
  kind: "movie" | "drama";
  title: string;
  meta: string;
  synopsis: string | null;
  tag: string | null;
  rating: number | null;
  posterUrl: string | null;
  videoAssetId: string | null;
  reviewStatus: ReviewStatus;
  review: ApiReview | null;
  filters: FilterValues;
  similarIds: string[];
  episodes: { id: string; numberLabel: string; title: string; duration: string }[];
}

export const useTitles = createResource<AdminTitle>({
  list: async () =>
    (await api<ApiTitle[]>("/admin/titles")).map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      meta: row.meta,
      synopsis: orUndefined(row.synopsis),
      tag: orUndefined(row.tag),
      rating: row.rating === null ? undefined : row.rating.toFixed(1),
      posterUrl: orUndefined(row.posterUrl),
      videoAssetId: orUndefined(row.videoAssetId),
      filters: row.filters,
      similarIds: row.similarIds.length ? row.similarIds : undefined,
      episodes: row.episodes.length ? row.episodes.map((episode) => ({ id: episode.id, number: episode.numberLabel, title: episode.title, duration: episode.duration, progressPct: 0 })) : undefined,
      review: toReview(row.reviewStatus, row.review),
    })),
  create: (title) => api("/admin/titles", { method: "POST", body: titleBody(title) }),
  update: (id, title) => api(`/admin/titles/${id}`, { method: "PATCH", body: titleBody(title) }),
  remove: (id) => api(`/admin/titles/${id}`, { method: "DELETE" }),
});

function titleBody(title: AdminTitle) {
  return {
    kind: title.kind,
    title: title.title,
    meta: title.meta,
    synopsis: text(title.synopsis),
    tag: text(title.tag),
    rating: title.rating ? Number(title.rating) : undefined,
    posterUrl: title.posterUrl,
    videoAssetId: title.videoAssetId,
    filters: title.filters,
    similarIds: title.similarIds ?? [],
    episodes: title.kind === "drama" ? (title.episodes ?? []).map(({ id, number, title: name, duration }) => ({ id, number, title: name, duration })) : [],
  };
}

/* ───────── live events ───────── */

interface ApiLiveEvent {
  id: string;
  title: string;
  host: string;
  synopsis: string;
  category: string;
  language: string;
  startsAt: string;
  durationMin: number;
  access: "free" | "paid";
  price: number | null;
  capacity: number | null;
  booked: number;
  status: AdminLiveShow["status"];
  viewers: number | null;
  replayDays: number;
  reviewStatus: ReviewStatus;
  review: ApiReview | null;
  filters: FilterValues;
}

export const useLiveShows = createResource<AdminLiveShow>({
  list: async () =>
    (await api<ApiLiveEvent[]>("/admin/live-events")).map((row) => ({
      id: row.id,
      title: row.title,
      host: row.host,
      synopsis: row.synopsis,
      category: row.category,
      language: row.language,
      startsAt: row.startsAt,
      durationMin: row.durationMin,
      access: row.access,
      price: orUndefined(row.price),
      capacity: orUndefined(row.capacity),
      booked: row.booked,
      status: row.status,
      viewers: row.viewers === null ? undefined : compact(row.viewers),
      replayDays: row.replayDays,
      filters: row.filters,
      review: toReview(row.reviewStatus, row.review),
    })),
  create: (show) => api("/admin/live-events", { method: "POST", body: liveBody(show) }),
  update: (id, show) => api(`/admin/live-events/${id}`, { method: "PATCH", body: liveBody(show) }),
  remove: (id) => api(`/admin/live-events/${id}`, { method: "DELETE" }),
});

function liveBody(show: AdminLiveShow) {
  const paid = show.access === "paid";
  return {
    title: show.title,
    host: show.host,
    synopsis: show.synopsis,
    startsAt: show.startsAt,
    durationMin: show.durationMin,
    access: show.access,
    price: paid ? show.price : undefined,
    capacity: paid ? show.capacity : undefined,
    replayDays: show.replayDays,
    filters: show.filters,
  };
}

/** Schedule / go live / end / publish replay / cancel (server applies refunds + notifications). */
export const transitionLive = (id: string, to: AdminLiveShow["status"]) => api(`/admin/live-events/${id}/transition`, { method: "POST", body: { to } });

/* ───────── rolls ───────── */

interface ApiRoll {
  id: string;
  handle: string;
  caption: string;
  soundName: string;
  sourceTitle: string | null;
  views: number;
  likes: number;
  comments: number;
  reviewStatus: ReviewStatus;
  review: ApiReview | null;
  filters: FilterValues;
}

export const useRolls = createResource<AdminRoll>({
  list: async () =>
    (await api<ApiRoll[]>("/admin/rolls")).map((row) => ({
      id: row.id,
      handle: row.handle,
      caption: row.caption,
      soundName: row.soundName,
      sourceTitle: orUndefined(row.sourceTitle),
      viewCount: compact(row.views),
      likeCount: compact(row.likes),
      commentCount: row.comments.toLocaleString("en-IN"),
      filters: row.filters,
      review: toReview(row.reviewStatus, row.review),
    })),
  create: (roll) => api("/admin/rolls", { method: "POST", body: rollBody(roll) }),
  update: (id, roll) => api(`/admin/rolls/${id}`, { method: "PATCH", body: rollBody(roll) }),
  remove: (id) => api(`/admin/rolls/${id}`, { method: "DELETE" }),
});

const rollBody = (roll: AdminRoll) => ({ handle: roll.handle, caption: roll.caption, soundName: roll.soundName, sourceTitle: text(roll.sourceTitle), filters: roll.filters });

/* ───────── bookings ───────── */

interface ApiBooking {
  id: string;
  eventId: string;
  status: Booking["status"];
  amount: number;
  method: Booking["method"] | null;
  reminder: boolean;
  createdAt: string;
  userEmail: string;
}

export const useBookingsStore = createResource<Booking>({
  list: async () =>
    (await api<ApiBooking[]>("/admin/bookings")).map((row) => ({
      id: row.id,
      showId: row.eventId,
      userId: row.userEmail,
      status: row.status,
      amount: row.amount,
      method: orUndefined(row.method),
      reminder: row.reminder,
      createdAt: row.createdAt,
    })),
});

export const refundBooking = (id: string) => api(`/admin/bookings/${id}/refund`, { method: "POST" });
export const cancelRsvp = (id: string) => api(`/admin/bookings/${id}/cancel`, { method: "POST" });

/* ───────── filters ───────── */

interface ApiFilterGroup extends Omit<FilterGroup, "description" | "options"> {
  description: string | null;
  options: { id: string; label: string; slug: string; imageUrl: string | null; active: boolean }[];
}

export const useFilters = createResource<FilterGroup>({
  list: async () =>
    (await api<ApiFilterGroup[]>("/admin/filters")).map((group) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: orUndefined(group.description),
      appliesTo: group.appliesTo,
      multiple: group.multiple,
      showOnSite: group.showOnSite,
      options: group.options.map((option) => ({ id: option.id, label: option.label, slug: option.slug, imageUrl: orUndefined(option.imageUrl), active: option.active })),
    })),
});

/** Filter groups and options have their own endpoints (the page calls these, then reloads). */
export const filtersApi = {
  saveGroup: (group: Pick<FilterGroup, "name" | "slug" | "description" | "appliesTo" | "multiple" | "showOnSite">, id?: string) =>
    api(id ? `/admin/filters/${id}` : "/admin/filters", { method: id ? "PATCH" : "POST", body: { ...group, slug: text(group.slug), description: text(group.description) } }),
  deleteGroup: (id: string) => api(`/admin/filters/${id}`, { method: "DELETE" }),
  saveOption: (groupId: string, option: { label: string; slug?: string; imageUrl?: string; active: boolean }, id?: string) =>
    api(id ? `/admin/filters/${groupId}/options/${id}` : `/admin/filters/${groupId}/options`, {
      method: id ? "PATCH" : "POST",
      body: { label: option.label, slug: text(option.slug), imageUrl: text(option.imageUrl), active: option.active },
    }),
  deleteOption: (groupId: string, id: string) => api(`/admin/filters/${groupId}/options/${id}`, { method: "DELETE" }),
};

/* ───────── sections ───────── */

interface ApiSection {
  id: string;
  page: Section["page"];
  title: string;
  slug: string;
  layout: Section["layout"];
  sourceType: SectionSource["type"];
  contentType: ContentType | null;
  groupId: string | null;
  optionId: string | null;
  autoRule: string | null;
  active: boolean;
  items: { itemType: ContentType; itemId: string }[];
}

function toSource(row: ApiSection): SectionSource {
  switch (row.sourceType) {
    case "manual":
      return { type: "manual", contentType: row.contentType ?? row.items[0]?.itemType ?? "movie", itemIds: row.items.map((item) => item.itemId) };
    case "filter":
      return { type: "filter", contentType: row.contentType ?? "movie", groupId: row.groupId ?? "", optionId: row.optionId ?? "" };
    case "group":
      return { type: "group", groupId: row.groupId ?? "" };
    case "auto":
      return { type: "auto", rule: (row.autoRule ?? "top-rated") as Extract<SectionSource, { type: "auto" }>["rule"] };
  }
}

export const useSections = createResource<Section>({
  list: async () =>
    (await api<ApiSection[]>("/admin/sections")).map((row) => ({ id: row.id, page: row.page, title: row.title, slug: row.slug, layout: row.layout, active: row.active, source: toSource(row) })),
  create: (section) => api("/admin/sections", { method: "POST", body: sectionBody(section) }),
  update: (id, section) => api(`/admin/sections/${id}`, { method: "PATCH", body: sectionBody(section) }),
  remove: (id) => api(`/admin/sections/${id}`, { method: "DELETE" }),
  move: (id, delta) => api(`/admin/sections/${id}/move`, { method: "POST", body: { delta } }),
});

function sectionBody(section: Section) {
  const { source } = section;
  return {
    page: section.page,
    title: section.title,
    slug: text(section.slug),
    layout: section.layout,
    active: section.active,
    sourceType: source.type,
    contentType: "contentType" in source ? source.contentType : undefined,
    itemIds: source.type === "manual" ? source.itemIds : undefined,
    groupId: "groupId" in source ? source.groupId : undefined,
    optionId: source.type === "filter" ? source.optionId : undefined,
    autoRule: source.type === "auto" ? source.rule : undefined,
  };
}

/* ───────── staff ───────── */

interface ApiAdminUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: AdminUser["status"];
  lastActiveAt: string | null;
}

export const useUsers = createResource<AdminUser & { password?: string }>({
  list: async () => (await api<ApiAdminUser[]>("/admin/users")).map((user) => ({ ...user, lastActiveAt: orUndefined(user.lastActiveAt) })),
  create: (user) => api("/admin/users", { method: "POST", body: userBody(user) }),
  update: (id, user) => api(`/admin/users/${id}`, { method: "PATCH", body: userBody(user) }),
  remove: (id) => api(`/admin/users/${id}`, { method: "DELETE" }),
});

const userBody = (user: AdminUser & { password?: string }) => ({ name: user.name, email: user.email, roleId: user.roleId, status: user.status, password: text(user.password) });

export const useRoles = createResource<Role>({
  list: async () => (await api<(Role & { members: number })[]>("/admin/roles")).map(({ members: _members, ...role }) => role),
  create: (role) => api("/admin/roles", { method: "POST", body: { name: role.name, description: role.description, permissions: role.permissions } }),
  update: (id, role) => api(`/admin/roles/${id}`, { method: "PATCH", body: { name: role.name, description: role.description, permissions: role.permissions } }),
  remove: (id) => api(`/admin/roles/${id}`, { method: "DELETE" }),
});

/* ───────── moderation ───────── */

export const useRules = createResource<Rule>({
  list: () => api<Rule[]>("/admin/rules"),
  create: (rule) => api("/admin/rules", { method: "POST", body: ruleBody(rule) }),
  update: (id, rule) => api(`/admin/rules/${id}`, { method: "PATCH", body: ruleBody(rule) }),
  remove: (id) => api(`/admin/rules/${id}`, { method: "DELETE" }),
});

const ruleBody = (rule: Rule) => ({ title: rule.title, description: rule.description, severity: rule.severity, appliesTo: rule.appliesTo, active: rule.active });

/** Approve / reject an item against the rule book. */
export const decideReview = (type: ContentType, id: string, decision: { status: "approved" | "rejected"; passedRuleIds: string[]; note?: string }) =>
  api(`/admin/reviews/${type}/${id}`, { method: "POST", body: decision });
