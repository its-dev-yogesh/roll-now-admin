import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "light";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  small?: boolean;
  iconOnly?: boolean;
  round?: boolean;
}

export function Button({ variant = "secondary", small, iconOnly, round, className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cx("btn", variant !== "secondary" && `btn-${variant}`, small && "btn-sm", iconOnly && "btn-icon", round && "btn-round", className)}
      {...rest}
    />
  );
}
