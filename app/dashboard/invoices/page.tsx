import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(
      "id, created_at, ref, client_name, event_date, total, deposit, balance, status"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Invoices</h1>
        <p style={{ marginTop: 12 }}>Error loading invoices: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Invoices</h1>

        <Link
          href="/dashboard/invoices/new"
          style={{ textDecoration: "none", fontWeight: 700 }}
        >
          + New Invoice
        </Link>
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr 130px 110px 110px 110px 110px",
            gap: 12,
            padding: 12,
            background: "#fafafa",
            fontWeight: 700,
          }}
        >
          <div>Ref</div>
          <div>Client</div>
          <div>Event date</div>
          <div>Status</div>
          <div style={{ textAlign: "right" }}>Total</div>
          <div style={{ textAlign: "right" }}>Deposit</div>
          <div style={{ textAlign: "right" }}>Balance</div>
        </div>

        {(invoices || []).map((inv) => (
          <div
            key={inv.id}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr 130px 110px 110px 110px 110px",
              gap: 12,
              padding: 12,
              borderTop: "1px solid #eee",
            }}
          >
            <div style={{ fontWeight: 700 }}>
  <Link
    href={`/dashboard/invoices/${inv.id}`}
    style={{ textDecoration: "none" }}
  >
    {inv.ref}
  </Link>
</div>

            <div>{inv.client_name}</div>
            <div>{inv.event_date ?? "-"}</div>
            <div>{inv.status}</div>
            <div style={{ textAlign: "right" }}>
              £{Number(inv.total ?? 0).toFixed(2)}
            </div>
            <div style={{ textAlign: "right" }}>
              £{Number(inv.deposit ?? 0).toFixed(2)}
            </div>
            <div style={{ textAlign: "right", fontWeight: 800 }}>
              £{Number(inv.balance ?? 0).toFixed(2)}
            </div>
          </div>
        ))}

        {(!invoices || invoices.length === 0) && (
          <div style={{ padding: 12, opacity: 0.75 }}>No invoices yet.</div>
        )}
      </div>
    </div>
  );
}
