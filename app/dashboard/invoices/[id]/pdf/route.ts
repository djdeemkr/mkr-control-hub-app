import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("PDF: auth.getUser error:", userErr);
      return new Response(
        JSON.stringify({ error: "Auth error", details: userErr.message }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", userData.user.id)
      .single();

    if (invErr || !invoice) {
      console.error("PDF: invoice fetch error:", invErr);
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: payments, error: payErr } = await supabase
      .from("payments")
      .select("amount, paid_at, method, notes, created_at")
      .eq("invoice_id", params.id)
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: true });

    if (payErr) {
      console.error("PDF: payments fetch error:", payErr);
    }

    const paymentsTotal =
      (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    const total = Number(invoice.total || 0);
    const deposit = Number(invoice.deposit || 0);
    const balance = Number(invoice.balance || 0);

    // ✅ Robust module loading for pdfkit (CJS/ESM compatibility)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfkitMod = require("pdfkit");
    const PDFDocument =
      pdfkitMod?.default ?? pdfkitMod?.PDFDocument ?? pdfkitMod;

    if (typeof PDFDocument !== "function") {
      console.error("PDF: pdfkit module shape unexpected:", pdfkitMod);
      return new Response(
        JSON.stringify({
          error: "PDF generation failed",
          message: "pdfkit did not export a constructor",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (e: any) => reject(e));

      const money = (n: number) => `£${Number(n || 0).toFixed(2)}`;

      doc.fontSize(20).fillColor("#000").text("MKR Control Hub", { align: "left" });
      doc.fontSize(11).fillColor("#555").text("Invoice", { align: "left" });
      doc.moveDown(1);
      doc.fillColor("#000");

      doc.fontSize(14).text(`Invoice Ref: ${invoice.ref}`);
      doc.fontSize(11).text(`Client: ${invoice.client_name}`);
      doc.fontSize(11).text(`Event Date: ${invoice.event_date ?? "-"}`);
      doc.fontSize(11).text(`Status: ${invoice.status ?? "Draft"}`);

      doc.moveDown(1);

      doc.fontSize(12).text("Summary", { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(11).text(`Total: ${money(total)}`);
      doc.fontSize(11).text(`Deposit: ${money(deposit)}`);
      doc.fontSize(11).text(`Payments: ${money(paymentsTotal)}`);

      doc.moveDown(0.25);
      doc.strokeColor("#eaeaea").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.25);

      doc.fontSize(12).text(`Balance Due: ${money(balance)}`);

      if (invoice.notes) {
        doc.moveDown(1);
        doc.fontSize(12).text("Notes", { underline: true });
        doc.moveDown(0.4);
        doc.fontSize(11).text(String(invoice.notes));
      }

      doc.moveDown(1);
      doc.fontSize(12).text("Payments", { underline: true });
      doc.moveDown(0.4);

      if (!payments?.length) {
        doc.fontSize(11).fillColor("#555").text("No payments recorded.");
        doc.fillColor("#000");
      } else {
        payments.forEach((p: any, idx: number) => {
          const labelParts: string[] = [];
          if (p.paid_at) labelParts.push(`Date: ${p.paid_at}`);
          if (p.method) labelParts.push(`Method: ${p.method}`);
          const label = labelParts.length ? `(${labelParts.join(" • ")})` : "";

          doc
            .fontSize(11)
            .fillColor("#000")
            .text(`${idx + 1}. ${money(Number(p.amount || 0))} ${label}`);

          if (p.notes) {
            doc.fontSize(10).fillColor("#555").text(`   ${p.notes}`);
          }

          doc.moveDown(0.2);
        });
      }

      doc.moveDown(2);
      doc
        .fontSize(9)
        .fillColor("#777")
        .text(
          "Generated by MKR Control Hub • Please keep this invoice for your records.",
          { align: "center" }
        );

      doc.end();
    });

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.ref}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("PDF: route crashed:", err);

    return new Response(
      JSON.stringify({
        error: "PDF generation failed",
        message: err?.message || String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
