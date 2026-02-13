"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // If already logged in, go straight to dashboard/next
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace(nextPath);
    })();
  }, [router, nextPath, supabase]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace(nextPath);
  };

  return (
    <main style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
        MKR Control Hub
      </h1>

      <p style={{ marginBottom: 24, opacity: 0.8 }}>
        Sign in to manage invoices and events.
      </p>

      <form onSubmit={signIn} style={{ display: "grid", gap: 12 }}>
        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />
        </label>

        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Password</div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {message && (
          <div style={{ fontSize: 14, opacity: 0.9 }}>{message}</div>
        )}
      </form>
    </main>
  );
}
