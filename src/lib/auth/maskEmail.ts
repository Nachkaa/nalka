export function maskEmail(email: string): string {
  const [rawLocal = "", rawDomain = ""] = email.split("@");
  const local = rawLocal.trim();
  const domain = rawDomain.trim();

  if (!local || !domain) return email;

  const first = local[0];
  const last = local.length > 2 ? local[local.length - 1] : "";
  const hiddenCount = Math.max(local.length - (last ? 2 : 1), 3);
  const maskedLocal = `${first}${"*".repeat(hiddenCount)}${last}`;

  const domainParts = domain.split(".");
  const domainMain = domainParts[0] ?? "";
  const domainTail = domainParts.slice(1).join(".");
  const maskedDomain =
    domainMain.length > 2
      ? `${domainMain[0]}${"*".repeat(Math.max(domainMain.length - 2, 2))}${domainMain.slice(-1)}`
      : `${domainMain || "*"}**`;

  return `${maskedLocal}@${maskedDomain}${domainTail ? `.${domainTail}` : ""}`;
}
