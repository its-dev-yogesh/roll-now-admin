import { FilterTags, ReviewBadge } from "@/components/content";
import { ResourcePage } from "@/components/layout";
import { Badge, Button, MediaCell, type BadgeTone } from "@/components/ui";
import { useConfirm } from "@/hooks/useConfirm";
import { reloadAll, reportError } from "@/hooks/resource";
import { transitionLive, useFilters, useLiveShows } from "@/hooks/useStores";
import { filterLabels, groupsFor } from "@/lib/content";
import { formatShowTime, fromISTInput, NEXT_STEP, STATUS_LABEL, toISTInput } from "@/lib/live";
import { createId } from "@/lib/ids";
import type { AdminLiveShow, FilterValues, LiveAccess, LiveShowStatus } from "@/types/catalog";

const STATUS_TONE: Record<LiveShowStatus, BadgeTone> = { draft: "neutral", scheduled: "neutral", live: "live", ended: "neutral", replay: "success", cancelled: "danger" };
const STATUSES: LiveShowStatus[] = ["live", "scheduled", "ended", "replay", "draft", "cancelled"];

/** Steps that affect viewers or can't be undone are confirmed first. */
const CONFIRM: Partial<Record<LiveShowStatus, string>> = {
  ended: "Viewers in the room will see the end card and chat will close.",
  cancelled: "The event is pulled from the site. Paid tickets are refunded and RSVPs cancelled.",
};

/** Live events: schedule → go live → end → publish replay (roll-now-api/docs/live-shows-flow.md §13). */
export function LiveEventsPage() {
  const shows = useLiveShows();
  const filters = useFilters().items;
  const { confirm, dialog } = useConfirm();

  function step(show: AdminLiveShow, to: LiveShowStatus, label: string) {
    // The API refunds tickets, notifies bookers and manages the IVS channel.
    const apply = () => transitionLive(show.id, to).then(reloadAll).catch(reportError);
    if (CONFIRM[to]) confirm({ title: `${label}: ${show.title}?`, message: CONFIRM[to], confirmLabel: label, tone: to === "cancelled" ? "danger" : "primary" }, apply);
    else apply();
  }

  return (
    <>
      <ResourcePage<AdminLiveShow>
        title="Live events"
        noun="live event"
        description="Free (RSVP) and ticketed events. Flow and statuses: roll-now-api/docs/live-shows-flow.md."
        items={[...shows.items].sort((a, b) => b.startsAt.localeCompare(a.startsAt))}
        store={shows}
        searchText={(show) => `${show.title} ${show.host} ${show.category}`}
        tabs={STATUSES.map((status) => ({ label: STATUS_LABEL[status], match: (show) => show.status === status }))}
        columns={[
          { header: "Event", render: (row) => <MediaCell seed={row.id} view="portrait" width={44} radius={8} title={row.title} meta={`${row.host}`} /> },
          { header: "Category", render: (row) => <FilterTags groups={filters} values={row.filters} groupId="category" /> },
          { header: "Starts (IST)", render: (row) => <span className="muted">{formatShowTime(row.startsAt)}</span> },
          { header: "Access", render: (row) => (row.access === "free" ? "Free" : `₹${row.price}`) },
          { header: "Booked", render: (row) => (row.capacity ? `${row.booked.toLocaleString("en-IN")} / ${row.capacity.toLocaleString("en-IN")}` : `${row.booked.toLocaleString("en-IN")} RSVPs`) },
          { header: "Status", render: (row) => <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge> },
          { header: "Review", render: (row) => <ReviewBadge review={row.review} /> },
        ]}
        rowActions={(row) => {
          const next = NEXT_STEP[row.status];
          const blocked = next && row.status === "draft" && row.review.status !== "approved";
          return (
            <>
              {next && (
                <Button
                  small
                  variant={row.status === "live" ? "danger" : "primary"}
                  disabled={blocked}
                  title={blocked ? "Approve it in the review queue first" : undefined}
                  onClick={() => step(row, next.to, next.label)}
                >
                  {next.label}
                </Button>
              )}
              {(row.status === "draft" || row.status === "scheduled") && (
                <Button small variant="ghost" onClick={() => step(row, "cancelled", "Cancel event")}>
                  Cancel
                </Button>
              )}
            </>
          );
        }}
        canEdit={(row) => row.status === "draft" || row.status === "scheduled"}
        canDelete={(row) => row.status === "draft" || row.status === "cancelled"}
        form={{
          fields: [
            { kind: "text", name: "title", label: "Event title", required: true, placeholder: "Midnight Mic Stage" },
            { kind: "text", name: "host", label: "Host", required: true },
            { kind: "textarea", name: "synopsis", label: "Synopsis", required: true },
            {
              kind: "row",
              fields: [
                { kind: "datetime", name: "startsAt", label: "Starts at", hint: "India time (IST)", required: true },
                { kind: "number", name: "durationMin", label: "Duration", hint: "Minutes", required: true },
              ],
            },
            {
              kind: "select",
              name: "access",
              label: "Access",
              options: [
                { value: "free", label: "Free — RSVP for reminders" },
                { value: "paid", label: "Paid — ticket required (includes 7-day replay)" },
              ],
            },
            {
              kind: "row",
              show: (values) => values.access === "paid",
              fields: [
                { kind: "number", name: "price", label: "Ticket price (₹)", required: true },
                { kind: "number", name: "capacity", label: "Capacity", required: true },
              ],
            },
            { kind: "filters", name: "filters", label: "Filters", groups: groupsFor(filters, "live") },
          ],
          toValues: (show) => ({
            title: show?.title ?? "",
            host: show?.host ?? "",
            synopsis: show?.synopsis ?? "",
            startsAt: show ? toISTInput(show.startsAt) : "",
            durationMin: show?.durationMin ?? 60,
            access: show?.access ?? "free",
            price: show?.price ?? 99,
            capacity: show?.capacity ?? 1000,
            filters: show?.filters ?? {},
          }),
          fromValues: (values, existing) => {
            const picked = values.filters as FilterValues;
            const paid = values.access === "paid";
            return {
              ...existing,
              id: existing?.id ?? createId("show"),
              title: String(values.title),
              host: String(values.host),
              synopsis: String(values.synopsis),
              startsAt: fromISTInput(String(values.startsAt)),
              durationMin: Number(values.durationMin),
              access: values.access as LiveAccess,
              price: paid ? Number(values.price) : undefined,
              capacity: paid ? Number(values.capacity) : undefined,
              category: filterLabels(filters, picked, "category")[0] ?? existing?.category ?? "",
              language: filterLabels(filters, picked, "language")[0] ?? existing?.language ?? "",
              filters: picked,
              booked: existing?.booked ?? 0,
              status: existing?.status ?? "draft",
              replayDays: existing?.replayDays ?? 7,
              review: existing?.review ?? { status: "pending", passedRuleIds: [] },
            };
          },
        }}
      />
      {dialog}
    </>
  );
}
