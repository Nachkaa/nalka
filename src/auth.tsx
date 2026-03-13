// FILE: src/auth.tsx
import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

import { render } from "@react-email/render";
import MagicLinkEmail from "@/emails/MagicLinkEmail";
import { InviteEmail } from "@/emails/InviteEmail";

import nodemailer, { type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

type MailMode = "smtp" | "ethereal" | "console";

const MAIL_MODE: MailMode =
  (process.env.MAIL_MODE as MailMode) ??
  (process.env.NODE_ENV === "production" ? "smtp" : "ethereal");

function redact(v?: string | null) {
  if (!v) return "";
  if (v.length <= 6) return "***";
  return `${v.slice(0, 3)}***${v.slice(-2)}`;
}

function smtpConfigFromEnv(): SMTPTransport.Options {
  const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("SMTP config missing (SMTP_* or EMAIL_SERVER_*)");
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    dnsTimeout: 5_000,
    tls: { servername: host },
  };
}

let cachedTransporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter;

  if (MAIL_MODE === "console") {
    cachedTransporter = nodemailer.createTransport({ jsonTransport: true });
    console.log("[mail] MODE=console (jsonTransport)");
    return cachedTransporter;
  }

  if (MAIL_MODE === "smtp") {
    const cfg = smtpConfigFromEnv();
    cachedTransporter = nodemailer.createTransport(cfg);
    console.log(
      "[mail] MODE=smtp host=%s port=%d user=%s",
      cfg.host,
      cfg.port,
      redact((cfg.auth as { user: string }).user),
    );
    return cachedTransporter;
  }

  const acc = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: acc.user, pass: acc.pass },
  });

  console.log("[mail] MODE=ethereal user=%s pass=%s", redact(acc.user), redact(acc.pass));
  return cachedTransporter;
}

const providerServer: SMTPTransport.Options =
  MAIL_MODE === "smtp"
    ? smtpConfigFromEnv()
    : {
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: "ignored", pass: "ignored" },
      };

const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;

const providers: NextAuthOptions["providers"] = [];

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

providers.push(
  EmailProvider({
    maxAge: 60 * 60 * 24 * 7,
    server: providerServer,
    from: process.env.MAIL_FROM!,
    async sendVerificationRequest({ identifier, url, provider }) {
      const u = new URL(url);
      const redir = u.searchParams.get("redirectTo") || u.searchParams.get("callbackUrl") || "";

      const cb = redir ? new URL(redir, u.origin) : null;
      const isInvite = cb?.searchParams.get("source") === "invite";

      const emailComponent = isInvite
        ? InviteEmail({
            link: url,
            eventTitle: cb?.searchParams.get("eventTitle") || "Votre evenement",
            inviterName: cb?.searchParams.get("inviter") || "Un membre",
            appName: "Nalka",
          })
        : MagicLinkEmail({
            url,
            appName: "Nalka",
            supportEmail: "contact@nalka.fr",
          });

      const html = await render(emailComponent);
      const text = await render(emailComponent, { plainText: true });
      const transporter = await getTransporter();

      let info: nodemailer.SentMessageInfo;
      try {
        info = await transporter.sendMail({
          to: identifier,
          from: provider.from ?? process.env.MAIL_FROM!,
          subject: isInvite
            ? "Invitation a rejoindre un evenement Nalka"
            : "Votre lien de connexion Nalka",
          html,
          text,
        });
      } catch (error) {
        throw error;
      }

      if (MAIL_MODE === "ethereal") {
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) console.log("[mail] ethereal preview:", preview);
      } else if (MAIL_MODE === "console") {
        const msg =
          typeof info.message === "string" ? info.message : (info.message?.toString?.() ?? "");
        console.log("[mail] console message:", msg || info);
      }
    },
  }),
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "database" },
  pages: { signIn: "/login", error: "/login" },
  providers,
};

const authRouteHandler = NextAuth(authOptions);

export const handlers = {
  GET: authRouteHandler,
  POST: authRouteHandler,
};

export function auth() {
  return getServerSession(authOptions);
}

type ServerSignInOptions = {
  email?: string;
  redirect?: boolean;
  redirectTo?: string;
  callbackUrl?: string;
};

type ServerSignInResult = {
  error?: string;
  ok: boolean;
  status: number;
  url: string | null;
};

function authBaseUrl() {
  return (
    process.env.NEXTAUTH_URL || process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || ""
  ).replace(/\/+$/, "");
}

export async function signIn(
  provider: string,
  options: ServerSignInOptions = {},
): Promise<ServerSignInResult> {
  if (provider !== "nodemailer" && provider !== "email") {
    return { ok: false, status: 400, url: null, error: "UNSUPPORTED_PROVIDER" };
  }

  const baseUrl = authBaseUrl();
  if (!baseUrl) {
    return { ok: false, status: 500, url: null, error: "MISSING_AUTH_BASE_URL" };
  }

  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, { cache: "no-store" });
  if (!csrfRes.ok) {
    return { ok: false, status: csrfRes.status, url: null, error: `CSRF_HTTP_${csrfRes.status}` };
  }

  const csrfData: unknown = await csrfRes.json();
  const csrfToken =
    typeof csrfData === "object" &&
    csrfData !== null &&
    "csrfToken" in csrfData &&
    typeof (csrfData as { csrfToken?: unknown }).csrfToken === "string"
      ? (csrfData as { csrfToken: string }).csrfToken
      : "";
  if (!csrfToken) {
    return { ok: false, status: 500, url: null, error: "MISSING_CSRF_TOKEN" };
  }

  const cookieHeader = csrfRes.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";", 1)[0])
    .filter(Boolean)
    .join("; ");

  const form = new URLSearchParams();
  form.set("csrfToken", csrfToken);
  if (options.email) form.set("email", options.email);
  const callbackUrl = options.redirectTo || options.callbackUrl;
  if (callbackUrl) form.set("callbackUrl", callbackUrl);
  form.set("json", "true");

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  };
  if (cookieHeader) headers.cookie = cookieHeader;

  const response = await fetch(`${baseUrl}/api/auth/signin/email`, {
    method: "POST",
    headers,
    body: form.toString(),
    redirect: "manual",
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const error =
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
      ? (payload as { error: string }).error
      : undefined;

  const url =
    typeof payload === "object" &&
    payload !== null &&
    "url" in payload &&
    typeof (payload as { url?: unknown }).url === "string"
      ? (payload as { url: string }).url
      : null;

  return {
    ok: response.ok && !error,
    status: response.status,
    url,
    error: error ?? (response.ok ? undefined : `SIGNIN_HTTP_${response.status}`),
  };
}
