import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Smaller heading for sections within a page. */
  section?: boolean;
}

export function PageHeader({ title, description, actions, section }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1 className={section ? "section-title" : "page-title"}>{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      {actions && <div className="inline">{actions}</div>}
    </div>
  );
}
