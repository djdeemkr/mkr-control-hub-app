import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: { id: string };
}

export default async function NewPaymentPage({ params }: PageProps) {
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

  async function addPayment(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) redirect("/login");

    const amount = Number(formData.get("amount") || 0);
    const paid_at_raw = String(formData.get("paid_at") || "").trim();
    const method = String(formData.get("method") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const paid_at = paid_at_raw ? paid_at_raw : null;

    if (!Number.isFinite(amount) || amount <= 0) return;

    // Insert payment (scoped to user)
    const { error: insertErr } = await supabase.from("payments").insert({
      user_id: userData.user.id,
      invoice_id: params.id,
      amount,
      paid_at,
      method: method || null,
      notes: notes || null,
    });

    if (insertErr) throw new Error(insertErr.message);

    // Recalculate balance = total - deposit - sum(payments)
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("invoice_id", params.id)
      .eq("user_id", userData.user.id);

    const paidTotal =
      (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    const total = Number(invoice.total || 0);
    const deposit = Number(invoice.deposit || 0);
    const newBalance = total - deposit - paidTotal;

    // Status automation (don’t overwrite Cancelled)
    let nextStatus = invoice.status ?? "Draft";
    if (nextStatus !== "Cancelled") {
      if (newBalance <= 0) nextStatus = "Paid";
      else if (deposit > 0 || paidTotal > 0) nextStatus = "Deposit Paid";
      else if (nextStatus === "Draft") nextStatus = "Booked";
    }

    const { error: updErr } = await supabase
      .from("invoices")
      .update({
        balance: newBalance,
        status: nextStatus,
      })
      .eq("id", params.id)
      .eq("user_id", userData.user.id);

    if (updErr) throw new Error(updErr.message);

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
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          Add Payment — {invoice.ref}
        </h1>

        <Link
          href={`/dashboard/invoices/${params.id}`}
          style={{ textDecoration: "none", fontWeight: 700, opacity: 0.85 }}
        >
          Cancel
        </Link>
      </div>

      <form action={addPayment} style={{ display: "grid", gap: 12 }}>
        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Amount (£) *</div>
          <input
            name="amount"
            type="number"
            step="0.01"
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
          <div style={{ fontSize: 14, marginBottom: 6 }}>Payment date</div>
          <input
            name="paid_at"
            type="date"
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 10,
            }}
          />
        </label>

        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Method</div>
          <input
            name="method"
            placeholder="Bank transfer / Cash / Card etc."
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 10,
            }}
          />
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
          Add Payment
        </button>
      </form>
    </div>
  );
}
