// FILE: src/auth.tsx
import NextAuth from "next-auth";
import NodemailerProvider from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
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

  // MAIL_MODE === "ethereal"
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

// NextAuth requires a "server" in the provider even when sendVerificationRequest is overridden.
// Use a safe placeholder when not in SMTP mode.
const providerServer: SMTPTransport.Options =
  MAIL_MODE === "smtp"
    ? smtpConfigFromEnv()
    : {
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: "ignored", pass: "ignored" },
      };

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "database" },

  pages: { signIn: "/login", error: "/login" },

  providers: [
    NodemailerProvider({
      id: "nodemailer",
      maxAge: 60 * 60 * 24 * 7,
      server: providerServer,
      from: process.env.MAIL_FROM!,

      async sendVerificationRequest({ identifier, url, provider }) {
        console.log("[mail] request:start to=%s", identifier);
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

        console.log("[mail] render:html:start to=%s", identifier);
        const html = await render(emailComponent);
        console.log("[mail] render:html:ok to=%s", identifier);
        console.log("[mail] render:text:start to=%s", identifier);
        const text = await render(emailComponent, { plainText: true });
        console.log("[mail] render:text:ok to=%s", identifier);

        console.log("[mail] transporter:start to=%s", identifier);
        const transporter = await getTransporter();
        console.log("[mail] transporter:ok to=%s", identifier);
        const startedAt = Date.now();
        console.log("[mail] send:start to=%s mode=%s", identifier, MAIL_MODE);

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
          console.log("[mail] send:ok to=%s durMs=%d", identifier, Date.now() - startedAt);
        } catch (error) {
          console.error(
            "[mail] send:fail to=%s durMs=%d error=%s",
            identifier,
            Date.now() - startedAt,
            error instanceof Error ? error.stack ?? error.message : String(error),
          );
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
  ],
});
