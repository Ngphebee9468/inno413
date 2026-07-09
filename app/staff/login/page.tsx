import Link from "next/link";
import { StaffLoginForm } from "./StaffLoginForm";

export default function StaffLoginPage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">i</span><span>inno413</span></Link>
        <nav className="nav"><Link className="ghost-button" href="/">Orders</Link><Link className="button" href="/orders/new">New Order</Link></nav>
      </header>
      <section className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Private staff area</p>
            <h1>Locked dashboard</h1>
          </div>
          <p className="muted">Customer order details are hidden until staff login.</p>
        </div>
        <StaffLoginForm />
      </section>
    </main>
  );
}
