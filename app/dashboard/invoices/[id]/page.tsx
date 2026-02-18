import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userData.user.id)
    .single();

  if (error || !invoice) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", params.id)
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  const paymentsTotal =
    (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

  return (
    <div style={{ maxWidth: 820 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Invoice {invoice.ref}</h1>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* ✅ Print page (reliable). Users can Save as PDF via browser print dialog */}
          <a
            href={`/dashboard/invoices/${invoice.id}/print`}
            style={{ textDecoration: "none", fontWeight: 800 }}
            target="_blank"
            rel="noreferrer"
          >
            Print / Save PDF
          </a>

          <Link
            href={`/dashboard/invoices/${invoice.id}/payments/new`}
            style={{ textDecoration: "none", fontWeight: 800 }}
          >
            + Add payment
          </Link>

          <Link
            href={`/dashboard/invoices/${invoice.id}/edit`}
            style={{ textDecoration: "none", fontWeight: 800 }}
          >
            Edit
          </Link>
        </div>
      </div>

      <div
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Client</div>
          <div style={{ fontWeight: 800 }}>{invoice.client_name}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Event date</div>
          <div style={{ fontWeight: 700 }}>{invoice.event_date ?? "-"}</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Total</div>
            <div style={{ fontWeight: 800 }}>
              £{Number(invoice.total ?? 0).toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Deposit</div>
            <div style={{ fontWeight: 800 }}>
              £{Number(invoice.deposit ?? 0).toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Payments</div>
            <div style={{ fontWeight: 800 }}>£{paymentsTotal.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Balance</div>
            <div style={{ fontWeight: 900 }}>
              £{Number(invoice.balance ?? 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Status</div>
          <div style={{ fontWeight: 800 }}>{invoice.status}</div>
        </div>

        {invoice.notes ? (
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Notes</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{invoice.notes}</div>
          </div>
        ) : null}
      </div>

      <div
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Payments</h2>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {payments?.length ? `${payments.length} payment(s)` : "No payments yet"}
          </div>
        </div>

        {payments?.length ? (
          <div style={{ display: "grid", gap: 8 }}>
            {payments.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: 10,
                  border: "1px solid #f0f0f0",
                  borderRadius: 10,
                }}
              >
                <div style={{ display: "grid", gap: 3 }}>
                  <div style={{ fontWeight: 900 }}>
                    £{Number(p.amount ?? 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    {p.paid_at ? `Date: ${p.paid_at}` : "Date: -"}{" "}
                    {p.method ? `• ${p.method}` : ""}
                  </div>
                  {p.notes ? (
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{p.notes}</div>
                  ) : null}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {p.created_at ? String(p.created_at).slice(0, 10) : ""}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
