export const EMAIL_BRAND = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  border: "#E7EAF0",
  text: "#111827",
  muted: "#4B5563",
  subtle: "#6B7280",
  primary600: "#4F39F6",
  primary700: "#3520D6",
  primary100: "#F1EEFF",
  onPrimary: "#FFFFFF",
} as const;

export const EMAIL_FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

export function EmailBrandHeader({ appName }: { appName: string }) {
  return (
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
              backgroundColor: EMAIL_BRAND.primary600,
              textAlign: "center",
              verticalAlign: "middle",
              boxShadow: "0 6px 16px rgba(17, 24, 39, 0.10)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                color: EMAIL_BRAND.onPrimary,
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
                color: EMAIL_BRAND.primary600,
                fontWeight: 700,
              }}
            >
              {appName}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
