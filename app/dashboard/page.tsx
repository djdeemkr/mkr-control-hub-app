import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // If not logged in, send them to login
  if (!data.user) {
    redirect("/login");
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Dashboard</h1>
      <p style={{ marginTop: 12 }}>
        You are logged in as: <strong>{data.user.email}</strong>
      </p>
    </main>
  );
}
