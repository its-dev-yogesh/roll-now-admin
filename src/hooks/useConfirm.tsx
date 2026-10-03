import { useState, type ReactNode } from "react";
import { ConfirmDialog, type ConfirmOptions } from "@/components/ui";

/** `confirm(options, onConfirm)` opens the shared confirm dialog; render `dialog` once in the page. */
export function useConfirm(): { confirm: (options: ConfirmOptions, onConfirm: () => void) => void; dialog: ReactNode } {
  const [pending, setPending] = useState<(ConfirmOptions & { onConfirm: () => void }) | null>(null);
  return {
    confirm: (options, onConfirm) => setPending({ ...options, onConfirm }),
    dialog: pending && (
      <ConfirmDialog
        {...pending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          pending.onConfirm();
          setPending(null);
        }}
      />
    ),
  };
}
