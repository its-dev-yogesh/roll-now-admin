/**
 * Content model shared with the viewer site — keep in sync with roll-now/src/types/catalog.ts.
 * Entity ↔ screen ↔ API mapping: roll-now-api/docs/data-model.md.
 */

export interface CastMember {
  id: string;
  name: string;
  /** Key art for the "Movies by actor" card — name, photo, and the actor's pop-out headroom
   * above the frame are already baked into this image; it's rendered as-is, uncropped. */
  cardImageUrl?: string;
}

export interface Episode {
  id: string;
  number: string;
  title: string;
  duration: string;
  progressPct: number;
}

export type TitleKind = "movie" | "drama";

export interface Title {
  id: string;
  kind: TitleKind;
  title: string;
  synopsis?: string;
  meta: string;
  tag?: string;
  rating?: string;
  languages?: string[];
  progressPct?: number;
  currentEpisodeLabel?: string;
  currentEpisodeId?: string;
  cast?: CastMember[];
  episodes?: Episode[];
  similarIds?: string[];
}

export type LiveShowStatus = "draft" | "scheduled" | "live" | "ended" | "replay" | "cancelled";
export type LiveAccess = "free" | "paid";

export interface LiveHighlight {
  id: string;
  caption: string;
  viewCount: string;
}

/** A live event. Lifecycle and rules: roll-now-api/docs/live-shows-flow.md. */
export interface LiveShow {
  id: string;
  title: string;
  category: string;
  language: string;
  host: string;
  synopsis: string;
  /** ISO 8601; always displayed in IST. */
  startsAt: string;
  durationMin: number;
  access: LiveAccess;
  /** INR, paid shows only. */
  price?: number;
  /** Paid shows only. */
  capacity?: number;
  booked: number;
  status: LiveShowStatus;
  viewers?: string;
  replayDays?: number;
  highlights?: LiveHighlight[];
}

export type BookingStatus = "pending" | "confirmed" | "failed" | "cancelled" | "refunded";
export type PaymentMethod = "upi" | "card";

export interface Booking {
  id: string;
  showId: string;
  /** Account that booked (the active profile until there's auth). */
  userId: string;
  status: BookingStatus;
  /** 0 for free RSVPs. */
  amount: number;
  method?: PaymentMethod;
  createdAt: string;
  reminder: boolean;
}

export interface Frame {
  id: string;
  handle: string;
  sourceTitle?: string;
  caption: string;
  soundName: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

/* ───────── admin model (roll-now-api/docs/data-model.md) ─────────
 * The site types above are what the viewer site renders. The admin stores the same records plus
 * the fields below; on save, the site-facing fields (languages, cast, category…) are derived from
 * the dynamic filters so both stay in one shape. */

export type ContentType = "movie" | "show" | "live" | "roll";

export interface FilterOption {
  id: string;
  label: string;
  slug: string;
  /** Tile / key art, e.g. category tiles or an actor's card. */
  imageUrl?: string;
  active: boolean;
}

/** A main filter (Genre, Language, Actors…) and its options — created and edited by admins. */
export interface FilterGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  appliesTo: ContentType[];
  /** Pick many options per item (languages, actors) or exactly one (certificate). */
  multiple: boolean;
  /** Show as a browse filter / tiles on the site. */
  showOnSite: boolean;
  options: FilterOption[];
}

/** filterGroupId → selected option ids */
export type FilterValues = Record<string, string[]>;

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  status: ReviewStatus;
  /** Rule ids the reviewer confirmed the media passes. */
  passedRuleIds: string[];
  note?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

/** Fields every piece of managed content carries. */
export interface Managed {
  filters: FilterValues;
  review: Review;
}

export type AdminTitle = Title & Managed & { posterUrl?: string; videoAssetId?: string };
export type AdminLiveShow = LiveShow & Managed;
export type AdminRoll = Frame & Managed;

export type SitePage = "home" | "movies" | "shows" | "live";
export type SectionLayout = "hero" | "landscape" | "portrait" | "poster" | "tiles";
export type AutoSource = "continue-watching" | "live-now" | "upcoming-live" | "replays" | "latest-rolls" | "top-rated";

export type SectionSource =
  | { type: "manual"; contentType: ContentType; itemIds: string[] }
  | { type: "filter"; contentType: ContentType; groupId: string; optionId: string }
  | { type: "group"; groupId: string }
  | { type: "auto"; rule: AutoSource };

/** One rail / block on a site page. Order in the store is the order on the page. */
export interface Section {
  id: string;
  page: SitePage;
  title: string;
  slug: string;
  layout: SectionLayout;
  source: SectionSource;
  active: boolean;
}

export type UserStatus = "active" | "invited" | "suspended";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: UserStatus;
  lastActiveAt?: string;
}

export const RESOURCES = ["content", "filters", "sections", "live", "bookings", "reviews", "rules", "users", "roles"] as const;
export const ACTIONS = ["view", "create", "edit", "delete", "publish"] as const;
export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
/** "resource:action", e.g. "content:publish". */
export type Permission = `${Resource}:${Action}`;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  /** Built-in roles can't be deleted. */
  system?: boolean;
}

export type RuleSeverity = "low" | "medium" | "high" | "critical";

/** A media-verification rule from the rule book; reviewers check content against active rules. */
export interface Rule {
  id: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  appliesTo: ContentType[];
  active: boolean;
}
