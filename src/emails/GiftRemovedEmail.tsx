import * as React from "react";

type Props = {
  recipientName: string;
  giftTitle: string;
  eventTitle: string;
  ownerName: string;
};

export default function GiftRemovedEmail({
  recipientName,
  giftTitle,
  eventTitle,
  ownerName,
}: Props) {
  return (
    <html>
      <body
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          backgroundColor: "#f9f7ef",
          color: "#222222",
          padding: "24px",
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{
            maxWidth: 600,
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <tbody>
            <tr>
              <td>
                <p style={{ fontSize: 14, margin: "0 0 16px" }}>Bonjour {recipientName},</p>

                <p style={{ fontSize: 14, margin: "0 0 12px" }}>
                  {ownerName} a retiré de sa liste le cadeau&nbsp;:
                </p>

                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    margin: "0 0 16px",
                  }}
                >
                  «&nbsp;{giftTitle}&nbsp;»
                </p>

                <p style={{ fontSize: 14, margin: "0 0 12px" }}>
                  Si tu avais prévu d&apos;offrir ce cadeau pour l&apos;événement «&nbsp;
                  {eventTitle}&nbsp;», tu peux maintenant choisir une autre idée sur sa liste.
                </p>

                <p style={{ fontSize: 14, margin: "0 0 24px" }}>
                  Merci d&apos;utiliser Nalka pour préparer vos cadeaux.
                </p>

                <p style={{ fontSize: 12, color: "#777777", margin: 0 }}>
                  Cet email t&apos;a été envoyé automatiquement par Nalka suite à une modification
                  de liste.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
