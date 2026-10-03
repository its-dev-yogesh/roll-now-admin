import type { ReactNode } from "react";
import { cx } from "./cx";

export interface CardProps {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  flush?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Card({ title, meta, actions, flush, className, children }: CardProps) {
  return (
    <section className={cx("card", flush && "card-flush", className)}>
      {(title || actions) && (
        <header className="card-header">
          <div className="grow">
            {title && <h2 className="card-title">{title}</h2>}
            {meta && <p className="muted small">{meta}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export interface StatCardProps {
  label: string;
  value: ReactNode;
  meta?: string;
}

export function StatCard({ label, value, meta }: StatCardProps) {
  return (
    <div className="card stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {meta && <span className="muted small">{meta}</span>}
    </div>
  );
}
