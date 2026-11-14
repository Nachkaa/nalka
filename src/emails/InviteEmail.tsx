import { Body, Head, Html, Preview } from "@react-email/components";
import { EMAIL_BRAND as TOKENS, EMAIL_FONT_FAMILY, EmailBrandHeader } from "./brand";

export function InviteEmail({
  link,
  eventTitle,
  inviterName,
  appName = "Nalka",
}: {
  link: string;
  eventTitle: string;
  inviterName: string;
  appName?: string;
}) {
  const preheader = `Invitation à « ${eventTitle} »`;

  return (
    <Html>
      <Head />
      <Preview>{preheader}</Preview>

      <Body
        style={{
          margin: 0,
          padding: "32px 0",
          backgroundColor: TOKENS.bg,
          fontFamily: EMAIL_FONT_FAMILY,
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
                        <EmailBrandHeader appName={appName} />
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
                            borderRadius: 20, // 2xl
                            padding: 32,
                            boxSizing: "border-box",
                            boxShadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
                          }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ paddingBottom: 10 }}>
                                <h1
                                  style={{
                                    margin: 0,
                                    fontSize: 24,
                                    lineHeight: "30px",
                                    fontWeight: 800,
                                    color: TOKENS.text,
                                    letterSpacing: "-0.02em",
                                    textAlign: "center",
                                  }}
                                >
                                  Invitation à un événement
                                </h1>
                              </td>
                            </tr>

                            <tr>
                              <td style={{ paddingBottom: 18 }}>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 15,
                                    lineHeight: "22px",
                                    color: TOKENS.muted,
                                    textAlign: "center",
                                  }}
                                >
                                  <strong style={{ color: TOKENS.text, fontWeight: 700 }}>
                                    {inviterName}
                                  </strong>{" "}
                                  vous a invité à rejoindre «{" "}
                                  <strong style={{ color: TOKENS.text, fontWeight: 700 }}>
                                    {eventTitle}
                                  </strong>
                                  ».
                                </p>
                              </td>
                            </tr>

                            {/* CTA */}
                            <tr>
                              <td align="center" style={{ paddingBottom: 12 }}>
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
                                          backgroundColor: TOKENS.primary600,
                                          borderRadius: 999,
                                          textAlign: "center",
                                          boxShadow: "0 10px 22px rgba(79, 57, 246, 0.26)",
                                        }}
                                      >
                                        <a
                                          href={link}
                                          style={{
                                            display: "block",
                                            padding: "14px 18px",
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: "#FFFFFF",
                                            textDecoration: "none",
                                            borderRadius: 999,
                                            lineHeight: "20px",
                                          }}
                                        >
                                          Rejoindre l’événement
                                        </a>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>

                            <tr>
                              <td style={{ paddingBottom: 18 }}>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 12,
                                    lineHeight: "18px",
                                    color: TOKENS.subtle,
                                    textAlign: "center",
                                  }}
                                >
                                  Ce lien est personnel. Si vous n’attendiez pas cette invitation,
                                  vous pouvez ignorer cet email.
                                </p>
                              </td>
                            </tr>

                            {/* Link fallback block */}
                            <tr>
                              <td style={{ paddingBottom: 18 }}>
                                <table
                                  role="presentation"
                                  cellPadding={0}
                                  cellSpacing={0}
                                  width="100%"
                                  style={{
                                    borderCollapse: "collapse",
                                    backgroundColor: TOKENS.primary100,
                                    border: `1px solid ${TOKENS.border}`,
                                    borderRadius: 16,
                                  }}
                                >
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: "14px 16px 10px 16px" }}>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: 13,
                                            lineHeight: "18px",
                                            color: TOKENS.muted,
                                          }}
                                        >
                                          Si le bouton ne fonctionne pas, copiez ce lien :
                                        </p>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style={{ padding: "0 16px 16px 16px" }}>
                                        <table
                                          role="presentation"
                                          cellPadding={0}
                                          cellSpacing={0}
                                          width="100%"
                                          style={{
                                            borderCollapse: "collapse",
                                            backgroundColor: "#FFFFFF",
                                            border: `1px solid ${TOKENS.border}`,
                                            borderRadius: 12,
                                          }}
                                        >
                                          <tbody>
                                            <tr>
                                              <td
                                                style={{
                                                  padding: "12px 12px",
                                                  fontFamily:
                                                    'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
                                                  fontSize: 12,
                                                  color: TOKENS.primary700,
                                                  wordBreak: "break-all",
                                                  lineHeight: "18px",
                                                }}
                                              >
                                                {link}
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

                            {/* Security notice */}
                            <tr>
                              <td>
                                <table
                                  role="presentation"
                                  cellPadding={0}
                                  cellSpacing={0}
                                  width="100%"
                                  style={{
                                    borderCollapse: "collapse",
                                    backgroundColor: "#F9FAFB",
                                    border: `1px solid ${TOKENS.border}`,
                                    borderRadius: 16,
                                  }}
                                >
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: "16px 16px 8px 16px" }}>
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
                                                  width: 22,
                                                  verticalAlign: "top",
                                                  paddingTop: 1,
                                                }}
                                              >
                                                <span
                                                  style={{
                                                    color: TOKENS.primary600,
                                                    fontSize: 14,
                                                    lineHeight: "18px",
                                                  }}
                                                >
                                                  🛡️
                                                </span>
                                              </td>
                                              <td>
                                                <p
                                                  style={{
                                                    margin: 0,
                                                    fontSize: 13,
                                                    lineHeight: "19px",
                                                    color: TOKENS.muted,
                                                  }}
                                                >
                                                  Si vous n’êtes pas la bonne personne, ignorez cet
                                                  email.
                                                  <br />
                                                  Pour des raisons de confidentialité, l’accès est
                                                  réservé aux personnes invitées.
                                                </p>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>

                                    <tr>
                                      <td style={{ padding: "0 16px" }}>
                                        <div
                                          style={{
                                            borderTop: `1px solid ${TOKENS.border}`,
                                            height: 1,
                                            lineHeight: "1px",
                                            fontSize: "1px",
                                          }}
                                        >
                                          &nbsp;
                                        </div>
                                      </td>
                                    </tr>

                                    <tr>
                                      <td style={{ padding: "10px 16px 16px 16px" }}>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: 13,
                                            lineHeight: "19px",
                                            color: TOKENS.muted,
                                          }}
                                        >
                                          Besoin d’aide ?{" "}
                                          <a
                                            href={`mailto:support@nalka.app`}
                                            style={{
                                              color: TOKENS.primary600,
                                              textDecoration: "none",
                                              fontWeight: 600,
                                            }}
                                          >
                                            contact@nalka.fr
                                          </a>
                                        </p>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
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
                                © {new Date().getFullYear()} {appName} — Prenez soin de vos
                                moments.
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
