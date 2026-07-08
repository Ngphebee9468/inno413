import Link from "next/link";

export default function PaymentCancelledPage({ searchParams }: { searchParams: { order?: string } }) {
  return (
    <main className="app-shell">
      <section className="page">
        <div className="card">
          <p className="eyebrow">Payment cancelled</p>
          <h1>Your order is saved</h1>
          <p className="muted">
            {searchParams.order ? `${searchParams.order} remains unpaid.` : "The deposit remains unpaid."}
          </p>
          <div className="actions">
            <Link className="ghost-button" href="/">Order board</Link>
            <Link className="button" href="/orders/new">Start another order</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
