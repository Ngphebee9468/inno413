"use client";

import { useRouter } from "next/navigation";

export function StaffLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/staff/login");
    router.refresh();
  }

  return (
    <button className="ghost-button" onClick={logout} type="button">
      Log out
    </button>
  );
}
