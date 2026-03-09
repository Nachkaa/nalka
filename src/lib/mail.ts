// FILE: src/lib/mail.ts
import nodemailer from "nodemailer";

type MailMode = "smtp" | "ethereal" | "console";

let cached: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cached) return cached;

  const mode: MailMode =
    (process.env.MAIL_MODE as MailMode) ||
    (process.env.NODE_ENV === "production" ? "smtp" : "ethereal");

  if (mode === "smtp") {
    const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
    const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
    if (!host || !user || !pass) {
      throw new Error("SMTP config missing (SMTP_HOST/USER/PASS or EMAIL_SERVER_*)");
    }
    cached = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return cached;
  }

  if (mode === "ethereal") {
    const account = await nodemailer.createTestAccount();
    cached = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: account.user, pass: account.pass },
    });
    return cached;
  }

  // mode === "console"
  cached = nodemailer.createTransport({ jsonTransport: true });
  return cached;
}

// type guard (avoid `any`)
function hasGetTestMessageUrl(lib: typeof nodemailer): lib is typeof nodemailer & {
  getTestMessageUrl: (info: nodemailer.SentMessageInfo) => string | false;
} {
  return (
    typeof (lib as unknown as { getTestMessageUrl?: unknown }).getTestMessageUrl === "function"
  );
}

// type guard (avoid `any`)
function isJsonTransporter(
  t: nodemailer.Transporter,
): t is nodemailer.Transporter & { transporter: { name?: string } } {
  const maybe = t as unknown as { transporter?: { name?: unknown } };
  return typeof maybe.transporter?.name === "string";
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM!,
    ...opts,
  });

  if (hasGetTestMessageUrl(nodemailer)) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log("[mail] Preview:", url);
  }

  if (isJsonTransporter(transporter) && transporter.transporter.name === "JSON") {
    const msg = (info as unknown as { message?: unknown }).message;
    console.log("[mail] JSON:", typeof msg === "string" ? msg : info);
  }

  return info;
}
