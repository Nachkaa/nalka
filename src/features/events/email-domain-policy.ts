import { z } from "zod";

export const EmailDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/^@/, ""))
  .pipe(
    z
      .string()
      .max(253)
      .regex(
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
        "Saisissez un domaine comme entreprise.fr, sans adresse e-mail ni lien.",
      ),
  );

export const EmailDomainListSchema = z
  .array(EmailDomainSchema)
  .max(20, "Vous pouvez autoriser jusqu’à 20 domaines.")
  .transform((domains) => [...new Set(domains)]);

export function parseEventEmailDomainFormData(formData: FormData) {
  if (formData.get("access.restrictEmailDomains") !== "on") return [];

  return EmailDomainListSchema.refine(
    (domains) => domains.length > 0,
    "Ajoutez au moins un domaine autorisé.",
  ).parse(formData.getAll("access.allowedEmailDomains"));
}

export function isEmailDomainAllowed(email: string, allowedEmailDomains: readonly string[]) {
  if (allowedEmailDomains.length === 0) return true;
  const parsed = z.email().max(254).safeParse(email.trim());
  if (!parsed.success) return false;
  const domain = parsed.data.split("@")[1].toLowerCase();
  return allowedEmailDomains.includes(domain);
}

export class EventEmailDomainError extends Error {
  constructor(public readonly code: "EMAIL_DOMAIN_NOT_ALLOWED" | "EMAIL_NOT_VERIFIED") {
    super(
      code === "EMAIL_NOT_VERIFIED"
        ? "Vérifiez votre adresse professionnelle avec un lien de connexion envoyé par e-mail."
        : "Cette adresse e-mail ne fait pas partie des domaines autorisés pour cet événement.",
    );
    this.name = "EventEmailDomainError";
  }
}

export function assertEmailDomainAccess(
  user: { email: string; emailVerified: Date | null },
  allowedEmailDomains: readonly string[],
) {
  if (allowedEmailDomains.length === 0) return;
  if (!isEmailDomainAllowed(user.email, allowedEmailDomains)) {
    throw new EventEmailDomainError("EMAIL_DOMAIN_NOT_ALLOWED");
  }
  if (!user.emailVerified) throw new EventEmailDomainError("EMAIL_NOT_VERIFIED");
}
