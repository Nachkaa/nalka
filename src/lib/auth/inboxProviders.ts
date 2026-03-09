const PROVIDER_URLS: Record<string, string> = {
  "gmail.com": "https://mail.google.com/",
  "googlemail.com": "https://mail.google.com/",
  "outlook.com": "https://outlook.live.com/",
  "outlook.fr": "https://outlook.live.com/",
  "hotmail.com": "https://outlook.live.com/",
  "hotmail.fr": "https://outlook.live.com/",
  "live.com": "https://outlook.live.com/",
  "live.fr": "https://outlook.live.com/",
  "office.com": "https://outlook.office.com/",
  "microsoft.com": "https://outlook.office.com/",
  "yahoo.com": "https://mail.yahoo.com/",
  "yahoo.fr": "https://mail.yahoo.com/",
  "proton.me": "https://mail.proton.me/",
  "protonmail.com": "https://mail.proton.me/",
  "icloud.com": "https://www.icloud.com/mail/",
  "me.com": "https://www.icloud.com/mail/",
  "mac.com": "https://www.icloud.com/mail/",
  "orange.fr": "https://mail.orange.fr/",
  "wanadoo.fr": "https://mail.orange.fr/",
  "free.fr": "https://zimbra.free.fr/",
  "sfr.fr": "https://webmail.sfr.fr/",
  "laposte.net": "https://webmail.laposte.net/",
};

export function resolveInboxUrl(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain) return null;

  const direct = PROVIDER_URLS[domain];
  if (direct) return direct;

  const matching = Object.entries(PROVIDER_URLS).find(([known]) => domain.endsWith(known));
  return matching ? matching[1] : null;
}

export const inboxProviders = PROVIDER_URLS;
