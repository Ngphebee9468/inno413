import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MaterialType } from "@/lib/types";
import { OrderForm } from "./OrderForm";

export const dynamic = "force-dynamic";

async function getMaterials() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [] as MaterialType[];
  }

  const supabase = await createClient();
  const { data } = await supabase.from("material_types").select("*").order("name");
  return (data ?? []) as MaterialType[];
}

export default async function NewOrderPage() {
  const materials = await getMaterials();

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">i</span><span>inno413</span></Link>
        <nav className="nav"><Link className="ghost-button" href="/">Orders</Link><Link className="ghost-button" href="/staff">Staff</Link></nav>
      </header>
      <section className="page">
        <div className="page-header order-brief-header">
          <div>
            <p className="eyebrow">New order</p>
            <h1>Build your t-shirt brief</h1>
          </div>
          <p className="muted">From team jerseys to corporate round-neck tees, start with the design details and confirm your 10% deposit.</p>
        </div>
        {materials.length === 0 ? (
          <div className="error-state">
            <h2>Materials are not available</h2>
            <p className="muted">Apply the Supabase migration and pull the Vercel environment to load material choices.</p>
          </div>
        ) : (
          <OrderForm materials={materials} />
        )}
      </section>
    </main>
  );
}
