import { useState } from "react";
import { ReviewBadge } from "@/components/content";
import { ResourcePage } from "@/components/layout";
import { Badge, Button, FormField, MediaCell, Modal, Switch, Textarea } from "@/components/ui";
import { reloadAll } from "@/hooks/resource";
import { decideReview, useLiveShows, useRolls, useRules, useTitles, useUsers } from "@/hooks/useStores";
import { capitalize, CONTENT_LABEL, formatDate, SEVERITY_TONE } from "@/lib/content";
import { posterSrc } from "@/lib/poster";
import type { ContentType, Review } from "@/types/catalog";

interface QueueItem {
  id: string;
  type: ContentType;
  title: string;
  meta: string;
  seed: string;
  src?: string;
  review: Review;
}

/** Every movie, show, live event and roll, checked against the rule book before it can go live. */
export function ReviewsPage() {
  const titles = useTitles();
  const shows = useLiveShows();
  const rolls = useRolls();
  const rules = useRules().items.filter((rule) => rule.active);
  const users = useUsers().items;
  const reviewerName = (id?: string) => users.find((user) => user.id === id)?.name ?? "—";
  const [deciding, setDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [open, setOpen] = useState<QueueItem | null>(null);
  const [passed, setPassed] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const items: QueueItem[] = [
    ...titles.items.map((title) => ({
      id: title.id,
      type: (title.kind === "movie" ? "movie" : "show") as ContentType,
      title: title.title,
      meta: title.meta,
      seed: title.id,
      src: posterSrc(title),
      review: title.review,
    })),
    ...shows.items.map((show) => ({ id: show.id, type: "live" as const, title: show.title, meta: `${show.category} · ${show.host}`, seed: show.id, review: show.review })),
    ...rolls.items.map((roll) => ({ id: roll.id, type: "roll" as const, title: roll.handle, meta: roll.caption, seed: roll.id, review: roll.review })),
  ];

  const checklist = open ? rules.filter((rule) => rule.appliesTo.includes(open.type)) : [];
  const allPassed = checklist.every((rule) => passed.includes(rule.id));

  function start(item: QueueItem) {
    setOpen(item);
    setPassed(item.review.passedRuleIds);
    setNote(item.review.note ?? "");
    setDecisionError(null);
  }

  /** The API re-checks the rules, publishes or hides the item, and records who decided. */
  async function decide(status: "approved" | "rejected") {
    if (!open) return;
    setDeciding(true);
    setDecisionError(null);
    try {
      await decideReview(open.type, open.id, { status, passedRuleIds: passed, note: note.trim() || undefined });
      await reloadAll();
      setOpen(null);
    } catch (error) {
      setDecisionError((error as Error).message);
    } finally {
      setDeciding(false);
    }
  }

  return (
    <>
      <ResourcePage<QueueItem>
        title="Review queue"
        noun="item"
        description="New and edited media waits here until a reviewer checks it against the rule book. Only approved items appear on the site."
        items={[...items].sort((a, b) => Number(b.review.status === "pending") - Number(a.review.status === "pending"))}
        searchText={(item) => `${item.title} ${item.meta}`}
        tabs={[
          { label: "Waiting", match: (item) => item.review.status === "pending" },
          { label: "Approved", match: (item) => item.review.status === "approved" },
          { label: "Rejected", match: (item) => item.review.status === "rejected" },
        ]}
        columns={[
          { header: "Media", render: (row) => <MediaCell seed={row.seed} src={row.src} title={row.title} meta={row.meta} view={row.type === "roll" ? "portrait" : "landscape"} width={row.type === "roll" ? 44 : 96} radius={10} /> },
          { header: "Type", render: (row) => <Badge>{CONTENT_LABEL[row.type]}</Badge> },
          { header: "Status", render: (row) => <ReviewBadge review={row.review} /> },
          { header: "Reviewed", render: (row) => <span className="muted">{row.review.reviewedAt ? `${reviewerName(row.review.reviewedBy)} · ${formatDate(row.review.reviewedAt)}` : "—"}</span> },
        ]}
        rowActions={(row) => (
          <Button small variant={row.review.status === "pending" ? "primary" : "secondary"} onClick={() => start(row)}>
            {row.review.status === "pending" ? "Review" : "Re-review"}
          </Button>
        )}
      />

      {open && (
        <Modal
          title={`Review: ${open.title}`}
          onClose={() => setOpen(null)}
          footer={
            <>
              {decisionError && <span className="form-error grow">{decisionError}</span>}
              <Button variant="danger" disabled={deciding || !note.trim()} title={note.trim() ? undefined : "Add a note explaining what to fix"} onClick={() => decide("rejected")}>
                Reject
              </Button>
              <Button variant="primary" disabled={deciding || !allPassed} title={allPassed ? undefined : "Confirm every rule first"} onClick={() => decide("approved")}>
                Approve
              </Button>
            </>
          }
        >
          <div className="stack">
            <MediaCell seed={open.seed} src={open.src} title={open.title} meta={`${CONTENT_LABEL[open.type]} · ${open.meta}`} width={160} radius={14} />
            <p className="muted text-xs">Watch the media, then confirm it passes each rule. Approve needs every rule confirmed; Reject needs a note for the uploader.</p>
            <div className="list">
              {checklist.map((rule) => (
                <div key={rule.id} className="list-row">
                  <div className="grow">
                    <div className="inline font-semibold">
                      {rule.title} <Badge tone={SEVERITY_TONE[rule.severity]}>{capitalize(rule.severity)}</Badge>
                    </div>
                    <div className="muted text-xs">{rule.description}</div>
                  </div>
                  <Switch
                    label={`Passes: ${rule.title}`}
                    checked={passed.includes(rule.id)}
                    onChange={(on) => setPassed((current) => (on ? [...current, rule.id] : current.filter((id) => id !== rule.id)))}
                  />
                </div>
              ))}
            </div>
            <FormField label="Note" hint="Required to reject — tell the uploader what to change">
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
            </FormField>
          </div>
        </Modal>
      )}
    </>
  );
}
