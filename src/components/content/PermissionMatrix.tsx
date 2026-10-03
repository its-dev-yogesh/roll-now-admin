import { ACTIONS, RESOURCES, type Permission } from "@/types/catalog";

const RESOURCE_LABEL: Record<(typeof RESOURCES)[number], string> = {
  content: "Movies, shows & rolls",
  filters: "Filters",
  sections: "Sections",
  live: "Live events",
  bookings: "Bookings",
  reviews: "Review queue",
  rules: "Rule book",
  users: "Users",
  roles: "Roles & permissions",
};

/** Resource × action checkbox grid for a role's permissions. */
export function PermissionMatrix({ value, onChange, disabled }: { value: Permission[]; onChange: (value: Permission[]) => void; disabled?: boolean }) {
  const toggle = (permission: Permission) => onChange(value.includes(permission) ? value.filter((other) => other !== permission) : [...value, permission]);

  return (
    <div className="table-wrap">
      <table className="table matrix">
        <thead>
          <tr>
            <th>Area</th>
            {ACTIONS.map((action) => (
              <th key={action}>{action}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RESOURCES.map((resource) => (
            <tr key={resource}>
              <td>{RESOURCE_LABEL[resource]}</td>
              {ACTIONS.map((action) => {
                const permission: Permission = `${resource}:${action}`;
                return (
                  <td key={action}>
                    <input type="checkbox" aria-label={`${RESOURCE_LABEL[resource]}: ${action}`} disabled={disabled} checked={value.includes(permission)} onChange={() => toggle(permission)} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
