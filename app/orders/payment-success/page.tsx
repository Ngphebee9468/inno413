import Link from "next/link";

export default function PaymentSuccessPage({ searchParams }: { searchParams: { type?: string } }) {
  const label = searchParams.type === "invoice" ? "Balance payment received" : "Deposit payment received";

  return (
    <main className="app-shell">
      <section className="page">
        <div className="card">
          <p className="eyebrow">Payment success</p>
          <h1>{label}</h1>
          <p className="muted">Stripe has accepted the payment. The webhook updates Supabase and the activity log.</p>
          <div className="actions">
            <Link className="ghost-button" href="/">Order board</Link>
            <Link className="button" href="/staff">Staff dashboard</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
