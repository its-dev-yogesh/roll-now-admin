import { Link, NavLink } from "react-router-dom";
import { cx } from "@/components/ui";
import { NAV } from "./navigation";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-brand" aria-label="Roll Now admin home">
        <img src="/brand/logo.png" alt="Roll Now" />
        <span className="eyebrow">Admin</span>
      </Link>

      {NAV.map((group, index) => (
        <nav key={index} aria-label={group.heading ?? "Overview"}>
          {group.heading && <h2 className="eyebrow nav-heading">{group.heading}</h2>}
          {group.items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => cx("nav-link", isActive && "active")}>
              <span className="nav-icon">
                <Icon size={18} />
              </span>
              {label}
              <span className="nav-dot" aria-hidden="true" />
            </NavLink>
          ))}
        </nav>
      ))}

      <div className="sidebar-footer">Live data · Roll Now API</div>
    </aside>
  );
}
