import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { render } from "@react-email/render";
import MagicLinkEmail from "@/emails/MagicLinkEmail";
import { InviteEmail } from "@/emails/InviteEmail";

type MailMode = "smtp" | "ethereal" | "console";
const MAIL_MODE: MailMode =
  (process.env.MAIL_MODE as MailMode) ??
  (process.env.NODE_ENV === "production" ? "smtp" : "ethereal");

function redact(v?: string) {
  if (!v) return v;
  return v.length <= 6 ? "***" : `${v.slice(0, 3)}***${v.slice(-2)}`;
}

async function getTransporter() {
  const nodemailer = (await import("nodemailer")).default;
  console.log("[auth] getTransporter mode=%s", MAIL_MODE);

  if (MAIL_MODE === "ethereal") {
    const acc = await nodemailer.createTestAccount();
    console.log("[auth] ethereal user=%s pass=%s", redact(acc.user), redact(acc.pass));
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: acc.user, pass: acc.pass },
    });
  }

  if (MAIL_MODE === "smtp") {
    const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
    const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
    console.log("[auth] smtp host=%s port=%d user=%s", host, port, redact(user));
    if (!host || !user || !pass) throw new Error("SMTP config missing");
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  console.log("[auth] console transport");
  return (await import("nodemailer")).default.createTransport({ jsonTransport: true });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "database" },

  pages: {
    signIn: "/login",
    error: "/login", // /api/auth/error?error=Verification -> /login?error=Verification
  },


  providers: [
    Nodemailer({
      id: "nodemailer",
      // 🔽 nouveau : durée de validité du lien (ici 7 jours)
      maxAge: 60 * 60 * 24 * 7,
      server: {
        host: process.env.SMTP_HOST || "",
        port: Number(process.env.SMTP_PORT || 587),
        auth: { user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASS || "" },
      },
      from: process.env.MAIL_FROM!,
      async sendVerificationRequest({ identifier, url, provider }) {
        const u = new URL(url);

        // Prefer redirectTo, fallback to callbackUrl
        const redir =
          u.searchParams.get("redirectTo") ||
          u.searchParams.get("callbackUrl") ||
          "";

        const cb = redir ? new URL(redir, u.origin) : null;
        const isInvite = cb?.searchParams.get("source") === "invite";

        console.log("[auth][send] to=%s invite=%s redir=%s", identifier, isInvite, redir);

        const html = await render(
          isInvite
            ? InviteEmail({
                link: url,
                eventTitle: cb?.searchParams.get("eventTitle") || "Votre événement",
                inviterName: cb?.searchParams.get("inviter") || "Un membre",
                appName: "Nalka",
              })
            : MagicLinkEmail({
                url,
                appName: "Nalka",
                supportEmail: "contact@nalka.fr",
              })
        );

        const transporter = await getTransporter();
        const info = await transporter.sendMail({
          to: identifier,
          from: provider.from,
          subject: isInvite
            ? "Invitation à rejoindre un événement Nalka"
            : "Votre lien de connexion Nalka",
          html,
        });

        const nodemailer = (await import("nodemailer")).default;
        const preview = (nodemailer as any).getTestMessageUrl?.(info);
        if (preview) console.log("[auth mail] Preview:", preview);
      },
    }),
  ],
});
