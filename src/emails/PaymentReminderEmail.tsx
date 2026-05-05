import { Body, Head, Html, Preview } from "@react-email/components";

type Payment = {
  label: string;
  vendorName: string | null;
  lineName: string;
  amount: string;
  dueDate: string;
  daysUntilDue: 7 | 1;
};

type EventReminder = {
  eventTitle: string;
  eventSlug: string;
  payments: Payment[];
};

type Props = {
  organizerName: string;
  appUrl: string;
  reminders: EventReminder[];
  unsubscribeNote: string;
};

export function PaymentReminderEmail({ organizerName, appUrl, reminders, unsubscribeNote }: Props) {
  const TOKENS = {
    bg: "#F6F7FB",
    card: "#FFFFFF",
    border: "#E7EAF0",
    text: "#111827",
    muted: "#4B5563",
    subtle: "#6B7280",
    primary600: "#4F39F6",
  };

  const totalPayments = reminders.reduce((sum, r) => sum + r.payments.length, 0);
  const preheader = `${totalPayments} paiement${totalPayments > 1 ? "s" : ""} à régler prochainement`;

  return (
    <Html>
      <Head />
      <Preview>{preheader}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "32px 0",
          backgroundColor: TOKENS.bg,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
          color: TOKENS.text,
        }}
      >
        <table
          role="presentation"
          cellPadding={0}
          cellSpacing={0}
          width="100%"
          style={{ borderCollapse: "collapse" }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  cellPadding={0}
                  cellSpacing={0}
                  width="100%"
                  style={{ maxWidth: 600, width: "100%", padding: "0 16px" }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td align="center" style={{ paddingBottom: 18 }}>
                        <table
                          role="presentation"
                          cellPadding={0}
                          cellSpacing={0}
                          style={{ borderCollapse: "collapse" }}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 12,
                                  backgroundColor: TOKENS.primary600,
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                  boxShadow: "0 6px 16px rgba(17, 24, 39, 0.10)",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    color: "#FFFFFF",
                                    fontSize: 16,
                                    lineHeight: "36px",
                                    fontWeight: 800,
                                  }}
                                >
                                  N
                                </span>
                              </td>
                              <td style={{ paddingLeft: 10 }}>
                                <span
                                  style={{
                                    fontSize: 16,
                                    color: TOKENS.primary600,
                                    fontWeight: 700,
                                  }}
                                >
                                  Nalka
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Card */}
                    <tr>
                      <td>
                        <table
                          role="presentation"
                          cellPadding={0}
                          cellSpacing={0}
                          width="100%"
                          style={{
                            backgroundColor: TOKENS.card,
                            border: `1px solid ${TOKENS.border}`,
                            borderRadius: 20,
                            padding: 32,
                            boxSizing: "border-box",
                            boxShadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
                          }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ paddingBottom: 8 }}>
                                <h1
                                  style={{
                                    margin: 0,
                                    fontSize: 22,
                                    lineHeight: "28px",
                                    fontWeight: 800,
                                    color: TOKENS.text,
                                    letterSpacing: "-0.02em",
                                  }}
                                >
                                  Rappel de paiements
                                </h1>
                              </td>
                            </tr>

                            <tr>
                              <td style={{ paddingBottom: 24 }}>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 15,
                                    lineHeight: "22px",
                                    color: TOKENS.muted,
                                  }}
                                >
                                  Bonjour{" "}
                                  <strong style={{ color: TOKENS.text }}>{organizerName}</strong>,
                                  les échéances suivantes approchent.
                                </p>
                              </td>
                            </tr>

                            {reminders.map((reminder, idx) => (
                              <tr key={idx}>
                                <td style={{ paddingBottom: 16 }}>
                                  <table
                                    role="presentation"
                                    cellPadding={0}
                                    cellSpacing={0}
                                    width="100%"
                                    style={{ borderCollapse: "collapse" }}
                                  >
                                    <tbody>
                                      <tr>
                                        <td style={{ paddingBottom: 10 }}>
                                          <p
                                            style={{
                                              margin: 0,
                                              fontSize: 12,
                                              fontWeight: 700,
                                              color: TOKENS.subtle,
                                              textTransform: "uppercase",
                                              letterSpacing: "0.07em",
                                            }}
                                          >
                                            {reminder.eventTitle}
                                          </p>
                                        </td>
                                      </tr>

                                      {reminder.payments.map((payment, pIdx) => {
                                        const badge =
                                          payment.daysUntilDue === 7
                                            ? {
                                                bg: "#FEF3C7",
                                                color: "#92400E",
                                                label: "J-7",
                                              }
                                            : {
                                                bg: "#FEE2E2",
                                                color: "#991B1B",
                                                label: "J-1",
                                              };
                                        return (
                                          <tr key={pIdx}>
                                            <td style={{ paddingBottom: 8 }}>
                                              <table
                                                role="presentation"
                                                cellPadding={0}
                                                cellSpacing={0}
                                                width="100%"
                                                style={{
                                                  borderCollapse: "collapse",
                                                  backgroundColor: "#F9FAFB",
                                                  border: `1px solid ${TOKENS.border}`,
                                                  borderRadius: 12,
                                                }}
                                              >
                                                <tbody>
                                                  <tr>
                                                    <td
                                                      style={{
                                                        padding: "12px 14px",
                                                        verticalAlign: "top",
                                                      }}
                                                    >
                                                      <span
                                                        style={{
                                                          display: "inline-block",
                                                          backgroundColor: badge.bg,
                                                          color: badge.color,
                                                          fontSize: 11,
                                                          fontWeight: 700,
                                                          borderRadius: 6,
                                                          padding: "2px 8px",
                                                          marginBottom: 6,
                                                          letterSpacing: "0.04em",
                                                        }}
                                                      >
                                                        {badge.label}
                                                      </span>
                                                      <p
                                                        style={{
                                                          margin: 0,
                                                          fontSize: 14,
                                                          fontWeight: 700,
                                                          color: TOKENS.text,
                                                          lineHeight: "20px",
                                                        }}
                                                      >
                                                        {payment.label}
                                                      </p>
                                                      <p
                                                        style={{
                                                          margin: "2px 0 0",
                                                          fontSize: 13,
                                                          color: TOKENS.muted,
                                                          lineHeight: "18px",
                                                        }}
                                                      >
                                                        {payment.lineName}
                                                        {payment.vendorName
                                                          ? ` · ${payment.vendorName}`
                                                          : ""}
                                                      </p>
                                                    </td>
                                                    <td
                                                      style={{
                                                        padding: "12px 14px",
                                                        verticalAlign: "top",
                                                        textAlign: "right",
                                                        whiteSpace: "nowrap",
                                                      }}
                                                    >
                                                      <p
                                                        style={{
                                                          margin: 0,
                                                          fontSize: 15,
                                                          fontWeight: 700,
                                                          color: TOKENS.text,
                                                          lineHeight: "20px",
                                                        }}
                                                      >
                                                        {payment.amount}
                                                      </p>
                                                      <p
                                                        style={{
                                                          margin: "2px 0 0",
                                                          fontSize: 12,
                                                          color: TOKENS.subtle,
                                                          lineHeight: "18px",
                                                        }}
                                                      >
                                                        {payment.dueDate}
                                                      </p>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        );
                                      })}

                                      <tr>
                                        <td style={{ paddingTop: 4, paddingBottom: 8 }}>
                                          <table
                                            role="presentation"
                                            cellPadding={0}
                                            cellSpacing={0}
                                            style={{ borderCollapse: "collapse" }}
                                          >
                                            <tbody>
                                              <tr>
                                                <td
                                                  style={{
                                                    backgroundColor: TOKENS.primary600,
                                                    borderRadius: 999,
                                                  }}
                                                >
                                                  <a
                                                    href={`${appUrl}/event/${reminder.eventSlug}/budget`}
                                                    style={{
                                                      display: "block",
                                                      padding: "9px 16px",
                                                      fontSize: 13,
                                                      fontWeight: 700,
                                                      color: "#FFFFFF",
                                                      textDecoration: "none",
                                                      borderRadius: 999,
                                                      lineHeight: "18px",
                                                    }}
                                                  >
                                                    Voir le budget →
                                                  </a>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>

                                  {idx < reminders.length - 1 && (
                                    <div
                                      style={{
                                        borderTop: `1px solid ${TOKENS.border}`,
                                        height: 1,
                                        lineHeight: "1px",
                                        fontSize: "1px",
                                        margin: "8px 0 24px",
                                      }}
                                    >
                                      &nbsp;
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}

                            <tr>
                              <td style={{ paddingTop: 8 }}>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 12,
                                    lineHeight: "18px",
                                    color: TOKENS.subtle,
                                    textAlign: "center",
                                  }}
                                >
                                  {unsubscribeNote}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Footer */}
                        <table
                          role="presentation"
                          cellPadding={0}
                          cellSpacing={0}
                          width="100%"
                          style={{ borderCollapse: "collapse" }}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  paddingTop: 18,
                                  textAlign: "center",
                                  fontSize: 12,
                                  lineHeight: "18px",
                                  color: "#9CA3AF",
                                }}
                              >
                                © {new Date().getFullYear()} Nalka — Prenez soin de vos moments.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}
