export function maskName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  return parts
    .map((part) => (part.length <= 2 ? `${part[0] ?? ""}*` : `${part[0]}${"*".repeat(Math.min(4, part.length - 1))}`))
    .join(" ");
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "email hidden";
  const visible = local.length <= 2 ? local[0] ?? "" : local.slice(0, 2);
  return `${visible}${"*".repeat(Math.min(5, Math.max(2, local.length - visible.length)))}@${domain}`;
}
