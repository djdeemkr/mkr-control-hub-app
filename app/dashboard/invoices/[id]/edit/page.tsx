import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: { id: string };
}

export default async function EditInvoicePage({ params }: PageProps) {
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

  async function updateInvoice(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) redirect("/login");

    const ref = String(formData.get("ref") || "").trim();
    const client_name = String(formData.get("client_name") || "").trim();
    const event_date_raw = String(formData.get("event_date") || "").trim();
    const total = Number(formData.get("total") || 0);
    const deposit = Number(formData.get("deposit") || 0);
    const status = String(formData.get("status") || "Draft").trim();
    const notes = String(formData.get("notes") || "").trim();

    const event_date = event_date_raw ? event_date_raw : null;

    if (!ref || !client_name) return;

    // Sum payments for this invoice
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("invoice_id", params.id)
      .eq("user_id", userData.user.id);

    const paidTotal =
      (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    const balance = total - deposit - paidTotal;

    const { error } = await supabase
      .from("invoices")
      .update({
        ref,
        client_name,
        event_date,
        total,
        deposit,
        balance,
        status,
        notes: notes || null,
      })
      .eq("id", params.id)
      .eq("user_id", userData.user.id);

    if (error) throw new Error(error.message);

    redirect(`/dashboard/invoices/${params.id}`);
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Edit Invoice</h1>

        <Link
          href={`/dashboard/invoices/${params.id}`}
          style={{ textDecoration: "none", fontWeight: 700, opacity: 0.85 }}
        >
          Cancel
        </Link>
      </div>

      <form action={updateInvoice} style={{ display: "grid", gap: 12 }}>
        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Ref *</div>
          <input
            name="ref"
            required
            defaultValue={invoice.ref ?? ""}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 10,
            }}
          />
        </label>

        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Client name *</div>
          <input
            name="client_name"
            required
            defaultValue={invoice.client_name ?? ""}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 10,
            }}
          />
        </label>

        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Event date</div>
          <input
            name="event_date"
            type="date"
            defaultValue={invoice.event_date ?? ""}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 10,
            }}
          />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <label>
            <div style={{ fontSize: 14, marginBottom: 6 }}>Total (£)</div>
            <input
              name="total"
              type="number"
              step="0.01"
              defaultValue={Number(invoice.total ?? 0)}
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 10,
              }}
            />
          </label>

          <label>
            <div style={{ fontSize: 14, marginBottom: 6 }}>Deposit (£)</div>
            <input
              name="deposit"
              type="number"
              step="0.01"
              defaultValue={Number(invoice.deposit ?? 0)}
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 10,
              }}
            />
          </label>
        </div>

        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Status</div>
          <select
            name="status"
            defaultValue={invoice.status ?? "Draft"}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 10,
            }}
          >
            <option value="Draft">Draft</option>
            <option value="Booked">Booked</option>
            <option value="Deposit Paid">Deposit Paid</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>

        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Notes</div>
          <textarea
            name="notes"
            rows={4}
            defaultValue={invoice.notes ?? ""}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 10,
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: 12,
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
