import { Link } from "react-router-dom";
import { BellIcon, Button, CloseIcon } from "@/components/ui";
import { useLiveShows, useRolls, useTitles } from "@/hooks/useStores";
import { logout, useSession } from "@/lib/session";

/** Right-hand top bar: page filter pills (portalled in by each page), review alerts, signed-in staff. */
export function TopBar({ onSlot }: { onSlot: (node: HTMLDivElement | null) => void }) {
  const pending = [...useTitles().items, ...useLiveShows().items, ...useRolls().items].filter((item) => item.review.status === "pending").length;
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : undefined;

  return (
    <div className="topbar">
      <div ref={onSlot} className="topbar-slot" />
      <Link to="/reviews" className="round-btn" aria-label={`${pending} items waiting for review`}>
        <BellIcon size={20} />
        {pending > 0 && <span className="notif-count">{pending}</span>}
      </Link>
      <div className="profile-pill" title={me?.role?.name}>
        <span className="avatar">{me?.name[0] ?? "?"}</span>
        <span>
          {me?.name}
          <span className="muted small block">{me?.role?.name}</span>
        </span>
        <Button variant="ghost" small iconOnly aria-label="Sign out" onClick={() => void logout()}>
          <CloseIcon size={16} />
        </Button>
      </div>
    </div>
  );
}
