import {
  BookIcon,
  DashboardIcon,
  FilmIcon,
  FilterIcon,
  LayersIcon,
  LiveIcon,
  RollsIcon,
  ShieldIcon,
  TicketIcon,
  TvIcon,
  UsersIcon,
  CheckIcon,
  type IconProps,
} from "@/components/ui";

export interface NavItem {
  to: string;
  label: string;
  icon: (props: IconProps) => React.JSX.Element;
}

export interface NavGroup {
  heading?: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  { items: [{ to: "/", label: "Dashboard", icon: DashboardIcon }] },
  {
    heading: "Content",
    items: [
      { to: "/movies", label: "Movies", icon: FilmIcon },
      { to: "/shows", label: "Shows", icon: TvIcon },
      { to: "/live", label: "Live events", icon: LiveIcon },
      { to: "/bookings", label: "Bookings", icon: TicketIcon },
      { to: "/rolls", label: "Rolls", icon: RollsIcon },
    ],
  },
  {
    heading: "Catalog setup",
    items: [
      { to: "/filters", label: "Filters", icon: FilterIcon },
      { to: "/sections", label: "Sections", icon: LayersIcon },
    ],
  },
  {
    heading: "Administration",
    items: [
      { to: "/users", label: "Users", icon: UsersIcon },
      { to: "/roles", label: "Roles & permissions", icon: ShieldIcon },
      { to: "/rules", label: "Rule book", icon: BookIcon },
      { to: "/reviews", label: "Review queue", icon: CheckIcon },
    ],
  },
];

export const NAV_ITEMS = NAV.flatMap((group) => group.items);
