import { ResourcePage } from "@/components/layout";
import { Badge, Button, MediaCell, StatCard, type BadgeTone } from "@/components/ui";
import { useConfirm } from "@/hooks/useConfirm";
import { reportError } from "@/hooks/resource";
import { cancelRsvp, refundBooking, useBookingsStore, useLiveShows } from "@/hooks/useStores";
import { capitalize, formatDate } from "@/lib/content";
import { formatShowTime } from "@/lib/live";
import type { Booking, BookingStatus } from "@/types/catalog";

const STATUS_TONE: Record<BookingStatus, BadgeTone> = { pending: "warning", confirmed: "success", failed: "danger", cancelled: "neutral", refunded: "neutral" };
const STATUSES: BookingStatus[] = ["confirmed", "pending", "failed", "refunded", "cancelled"];
const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

/** Tickets and RSVPs for live events (roll-now-api/docs/live-shows-flow.md §5–6, §14). Created by viewers, so no "Add". */
export function BookingsPage() {
  const bookings = useBookingsStore();
  const shows = useLiveShows();
  const { confirm, dialog } = useConfirm();

  const confirmed = bookings.items.filter((booking) => booking.status === "confirmed");
  const refunded = bookings.items.filter((booking) => booking.status === "refunded");
  const sum = (list: Booking[]) => list.reduce((total, booking) => total + booking.amount, 0);

  return (
    <>
      <ResourcePage<Booking>
        title="Bookings"
        noun="booking"
        description="Tickets for paid events and RSVPs for free ones. Payments are mocked until a gateway is connected."
        items={[...bookings.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
        searchText={(booking) => `${booking.id} ${booking.userId} ${shows.getById(booking.showId)?.title ?? ""}`}
        tabs={STATUSES.map((status) => ({ label: capitalize(status), match: (booking) => booking.status === status }))}
        columns={[
          { header: "Booking", render: (row) => <span className="mono">{row.id}</span> },
          {
            header: "Event",
            render: (row) => {
              const show = shows.getById(row.showId);
              return <MediaCell seed={row.showId} width={72} radius={10} title={show?.title ?? row.showId} meta={show && formatShowTime(show.startsAt)} />;
            },
          },
          { header: "Viewer", render: (row) => row.userId },
          { header: "Amount", render: (row) => (row.amount ? `${rupees(row.amount)} · ${row.method?.toUpperCase()}` : <span className="muted">Free RSVP</span>) },
          { header: "Booked on", render: (row) => <span className="muted">{formatDate(row.createdAt)}</span> },
          { header: "Reminder", render: (row) => (row.reminder ? "On" : <span className="muted">Off</span>), align: "center" },
          { header: "Status", render: (row) => <Badge tone={STATUS_TONE[row.status]}>{capitalize(row.status)}</Badge> },
        ]}
        rowActions={(row) =>
          row.status === "confirmed" &&
          (row.amount ? (
            <Button
              small
              onClick={() =>
                confirm(
                  { title: `Refund ${row.id}?`, message: `${rupees(row.amount)} goes back to ${row.userId} and their ticket is cancelled.`, confirmLabel: "Refund" },
                  () => refundBooking(row.id).then(bookings.reload).catch(reportError),
                )
              }
            >
              Refund
            </Button>
          ) : (
            <Button small variant="ghost" onClick={() => cancelRsvp(row.id).then(bookings.reload).catch(reportError)}>
              Cancel RSVP
            </Button>
          ))
        }
      >
        <div className="stats">
          <StatCard label="Ticket revenue" value={rupees(sum(confirmed))} meta="confirmed paid bookings" />
          <StatCard label="Tickets sold" value={confirmed.filter((booking) => booking.amount).length} />
          <StatCard label="RSVPs" value={confirmed.filter((booking) => !booking.amount).length} meta="free events" />
          <StatCard label="Refunded" value={rupees(sum(refunded))} meta={`${refunded.length} bookings`} />
        </div>
      </ResourcePage>
      {dialog}
    </>
  );
}
