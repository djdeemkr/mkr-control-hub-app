import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  async function createInvoice(formData: FormData) {
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
    const balance = total - deposit;

    if (!ref || !client_name) return;

    const { error } = await supabase.from("invoices").insert({
      user_id: userData.user.id,
      ref,
      client_name,
      event_date,
      total,
      deposit,
      balance,
      status,
      notes: notes || null,
    });

    if (error) throw new Error(error.message);

    redirect("/dashboard/invoices");
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
        New Invoice
      </h1>

      <form action={createInvoice} style={{ display: "grid", gap: 12 }}>
        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Ref *</div>
          <input
            name="ref"
            required
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
              defaultValue="0"
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
              defaultValue="0"
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
            defaultValue="Draft"
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
          Create Invoice
        </button>
      </form>
    </div>
  );
}
