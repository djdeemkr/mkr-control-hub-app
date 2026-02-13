import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        minHeight: "100vh",
      }}
    >
      <aside style={{ borderRight: "1px solid #e5e5e5", padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 16 }}>MKR Control Hub</div>

        <nav style={{ display: "grid", gap: 10 }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            Dashboard
          </Link>
          <Link href="/dashboard/invoices" style={{ textDecoration: "none" }}>
            Invoices
          </Link>
          <Link
            href="/dashboard/invoices/new"
            style={{ textDecoration: "none" }}
          >
            New Invoice
          </Link>
        </nav>

        <form action="/auth/logout" method="post" style={{ marginTop: 24 }}>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid #ddd",
              cursor: "pointer",
              fontWeight: 700,
              background: "white",
            }}
          >
            Log out
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
          Logged in as
          <br />
          <strong>{data.user.email}</strong>
        </div>
      </aside>

      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
