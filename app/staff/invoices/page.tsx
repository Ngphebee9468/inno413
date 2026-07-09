import Link from "next/link";
import { redirect } from "next/navigation";
import { hasStaffAccess } from "@/lib/staff-auth";
import { StaffLogoutButton } from "../StaffLogoutButton";

export default async function StaffInvoicesIndexPage() {
  if (!(await hasStaffAccess())) redirect("/staff/login");

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">i</span><span>inno413</span></Link>
        <nav className="nav"><Link className="ghost-button" href="/staff">Staff</Link><StaffLogoutButton /></nav>
      </header>
      <section className="page">
        <div className="empty-state">
          <h2>Choose an invoice from the staff dashboard</h2>
          <p className="muted">Invoice links are opened from the production queue or an order detail page.</p>
          <div className="actions">
            <Link className="button" href="/staff">Back to Staff Dashboard</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
