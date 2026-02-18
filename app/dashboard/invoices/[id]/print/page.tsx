import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({
  params,
}: {
  params: { id: string };
}) {
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
    .order("created_at", { ascending: true });

  const paymentsTotal =
    (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

  const money = (n: any) => `£${Number(n || 0).toFixed(2)}`;

  return (
    <div style={{ padding: 24, color: "#111", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Print button (hidden when printing) */}
        <div className="noprint" style={{ marginBottom: 16 }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Print / Save as PDF
          </button>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>MKR Control Hub</div>
            <div style={{ fontSize: 12, color: "#666" }}>Invoice</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800 }}>Ref: {invoice.ref}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              Status: {invoice.status ?? "Draft"}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              Event date: {invoice.event_date ?? "-"}
            </div>
          </div>
        </div>

        {/* Main box */}
        <div
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 16,
            marginTop: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "#666" }}>Client</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>
            {invoice.client_name}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
              marginTop: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>Total</div>
              <div style={{ fontWeight: 900 }}>{money(invoice.total)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>Deposit</div>
              <div style={{ fontWeight: 900 }}>{money(invoice.deposit)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>Payments</div>
              <div style={{ fontWeight: 900 }}>{money(paymentsTotal)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>Balance</div>
              <div style={{ fontWeight: 900 }}>{money(invoice.balance)}</div>
            </div>
          </div>

          {invoice.notes ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: "#666" }}>Notes</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{invoice.notes}</div>
            </div>
          ) : null}
        </div>

        {/* Payments box */}
        <div
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 16,
            marginTop: 12,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>
            Payments
          </div>

          {!payments?.length ? (
            <div style={{ fontSize: 12, color: "#666" }}>No payments recorded.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Method</th>
                  <th style={thStyle}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={tdStyle}>{money(p.amount)}</td>
                    <td style={tdStyle}>{p.paid_at ?? "-"}</td>
                    <td style={tdStyle}>{p.method ?? "-"}</td>
                    <td style={tdStyle}>{p.notes ?? ""}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 900 }}>{money(paymentsTotal)}</td>
                  <td style={tdStyle} colSpan={3}>
                    Total payments
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 18, fontSize: 12, color: "#666" }}>
          Generated by MKR Control Hub
        </div>

        {/* Print CSS */}
        <style>{`
          @media print {
            .noprint { display: none !important; }
            body { margin: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px",
  borderBottom: "1px solid #eee",
  fontSize: 12,
  color: "#666",
};

const tdStyle: React.CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #eee",
  fontSize: 13,
  color: "#111",
};
