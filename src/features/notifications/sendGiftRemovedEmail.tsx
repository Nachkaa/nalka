"use server";

import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import GiftRemovedEmail from "@/emails/GiftRemovedEmail";

type Args = {
  to: string;
  recipientName: string;
  giftTitle: string;
  eventTitle: string;
  ownerName: string;
};

const MAIL_MODE = process.env.MAIL_MODE ?? "console"; // smtp | ethereal | console

let transportPromise: Promise<Transporter | null> | null = null;

async function getTransport(): Promise<Transporter | null> {
  if (transportPromise) return transportPromise;

  if (MAIL_MODE === "console") {
    transportPromise = Promise.resolve(null);
    return transportPromise;
  }

  if (MAIL_MODE === "ethereal") {
    transportPromise = (async () => {
      // Si tu as déjà des identifiants en env, on les utilise
      if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
        return nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: process.env.ETHEREAL_USER,
            pass: process.env.ETHEREAL_PASS,
          },
        });
      }

      // Sinon on crée un compte de test à la volée
      const testAccount = await nodemailer.createTestAccount();
      console.log("[MAIL][ethereal] test account", {
        user: testAccount.user,
        pass: testAccount.pass,
      });

      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    })();

    return transportPromise;
  }

  // MAIL_MODE === "smtp"
  transportPromise = (async () => {
    if (!process.env.SMTP_HOST) {
      throw new Error("SMTP_HOST manquant pour MAIL_MODE=smtp");
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  })();

  return transportPromise;
}

export async function sendGiftRemovedEmail({
  to,
  recipientName,
  giftTitle,
  eventTitle,
  ownerName,
}: Args) {
  const html = await render(
    <GiftRemovedEmail
      recipientName={recipientName}
      giftTitle={giftTitle}
      eventTitle={eventTitle}
      ownerName={ownerName}
    />
  );

  const transport = await getTransport();

  // Mode console: on log, pas d’envoi réel
  if (!transport) {
    console.log(
      "[MAIL:GiftRemovedEmail][console]",
      { to, recipientName, giftTitle, eventTitle, ownerName },
      html
    );
    return;
  }

  const info = await transport.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Un cadeau a été retiré de la liste « ${eventTitle} »`,
    html,
  });

  if (MAIL_MODE === "ethereal") {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) {
      console.log("[MAIL:GiftRemovedEmail][ethereal] Preview URL:", url);
    }
  }
}
