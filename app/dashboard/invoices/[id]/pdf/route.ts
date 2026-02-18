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
    <html>
      <head>
        <title>Invoice {invoice.ref}</title>
        <style>{`
          body { font-family: Arial, sans-serif; padding: 24px; color:#111; }
          .wrap { max-width: 800px; margin: 0 auto; }
          .row { display:flex; justify-content:space-between; gap:16px; }
          .box { border:1px solid #e5e5e5; border-radius:12px; padding:16px; margin-top:12px; }
          h1 { margin:0 0 8px 0; }
          h2 { margin:0 0 10px 0; font-size:16px; }
          .muted { color:#666; font-size:12px; }
          table { width:100%; border-collapse: collapse; margin-top:8px; }
          th, td { text-align:left; padding:8px; border-bottom:1px solid #eee; font-size: 13px;}
          .totalrow td { font-weight:700; }
          @media print {
            .noprint { display:none; }
            body { padding:0; }
            .box { border:1px solid #ddd; }
          }
        `}</style>
      </head>
      <body>
        <div className="wrap">
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

          <div className="row">
            <div>
              <h1>MKR Control Hub</h1>
              <div className="muted">Invoice</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800 }}>Ref: {invoice.ref}</div>
              <div className="muted">Status: {invoice.status}</div>
              <div className="muted">Event date: {invoice.event_date ?? "-"}</div>
            </div>
          </div>

          <div className="box">
            <div className="muted">Client</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {invoice.client_name}
            </div>

            <div style={{ marginTop: 12 }} className="row">
              <div>
                <div className="muted">Total</div>
                <div style={{ fontWeight: 800 }}>{money(invoice.total)}</div>
              </div>
              <div>
                <div className="muted">Deposit</div>
                <div style={{ fontWeight: 800 }}>{money(invoice.deposit)}</div>
              </div>
              <div>
                <div className="muted">Payments</div>
                <div style={{ fontWeight: 800 }}>{money(paymentsTotal)}</div>
              </div>
              <div>
                <div className="muted">Balance</div>
                <div style={{ fontWeight: 900 }}>{money(invoice.balance)}</div>
              </div>
            </div>

            {invoice.notes ? (
              <div style={{ marginTop: 14 }}>
                <div className="muted">Notes</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{invoice.notes}</div>
              </div>
            ) : null}
          </div>

          <div className="box">
            <h2>Payments</h2>
            {!payments?.length ? (
              <div className="muted">No payments recorded.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{money(p.amount)}</td>
                      <td>{p.paid_at ?? "-"}</td>
                      <td>{p.method ?? "-"}</td>
                      <td>{p.notes ?? ""}</td>
                    </tr>
                  ))}
                  <tr className="totalrow">
                    <td>{money(paymentsTotal)}</td>
                    <td colSpan={3}>Total payments</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: 18 }} className="muted">
            Generated by MKR Control Hub
          </div>
        </div>
      </body>
    </html>
  );
}
