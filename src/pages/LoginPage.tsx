import { useState } from "react";
import { Button, FormField, Input } from "@/components/ui";
import { login, useSession } from "@/lib/session";

/** Staff sign-in. The API keeps the session in an httpOnly cookie — nothing is stored in the browser. */
export function LoginPage() {
  const session = useSession();
  const [busy, setBusy] = useState(false);

  return (
    <div className="login">
      <form
        className="card login-card form"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setBusy(true);
          await login(String(data.get("email")), String(data.get("password")));
          setBusy(false);
        }}
      >
        <div className="sidebar-brand">
          <img src="/brand/logo.png" alt="Roll Now" />
          <span className="eyebrow">Admin</span>
        </div>
        <h1 className="page-title">Sign in</h1>
        <FormField label="Email">
          <Input name="email" type="email" required autoComplete="username" placeholder="you@rollnow.studio" />
        </FormField>
        <FormField label="Password">
          <Input name="password" type="password" required autoComplete="current-password" />
        </FormField>
        {session.status === "signed-out" && session.error && <p className="form-error">{session.error}</p>}
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
