import {
    Html,
    Head,
    Preview,
    Body,
    Container,
    Section,
    Text,
    Button,
    Hr,
} from "@react-email/components";

export default function SecretSantaAssignedEmail({
    giverName,
    receiverName,
    eventTitle,
    eventUrl,
}: {
    giverName: string;
    receiverName: string;
    eventTitle: string;
    eventUrl: string;
}) {
    const brand = {
        bg: "#FAF8F1",
        card: "#FFFFFF",
        text: "#0B3D2E",
        muted: "#475569",
        border: "#E7E2D6",
        accent: "#EAB308",
        btnBg: "#0B3D2E",
        btnText: "#FFFBE6",
    };

    return (
        <Html>
            <Head />
            <Preview>Ton partenaire Secret Santa a été tiré 🎁</Preview>
            <Body
                style={{
                    backgroundColor: brand.bg,
                    fontFamily:
                        "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
                }}
            >
                <Container style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
                    <Section
                        style={{
                            backgroundColor: brand.card,
                            borderRadius: 16,
                            padding: 24,
                            border: `1px solid ${brand.border}`,
                        }}
                    >
                        <Text
                            style={{
                                margin: 0,
                                fontSize: 18,
                                fontWeight: 700,
                                color: brand.text,
                            }}
                        >
                            🎄 Secret Santa
                        </Text>

                        <Text style={{ marginTop: 12, fontSize: 16, color: brand.text }}>
                            Bonjour {giverName},
                            <br />
                            <br />
                            Le tirage au sort pour <b>{eventTitle}</b> est terminé !
                            <br />
                            Tu devras offrir un cadeau à :
                        </Text>

                        <Text
                            style={{
                                marginTop: 16,
                                fontSize: 20,
                                fontWeight: 700,
                                color: brand.accent,
                            }}
                        >
                            {receiverName}
                        </Text>

                        <Section style={{ textAlign: "center", marginTop: 24 }}>
                            <Button
                                href={eventUrl}
                                style={{
                                    display: "inline-block",
                                    padding: "12px 18px",
                                    borderRadius: 12,
                                    textDecoration: "none",
                                    fontWeight: 600,
                                    backgroundColor: brand.btnBg,
                                    color: brand.btnText,
                                    border: `1px solid ${brand.accent}`,
                                }}
                            >
                                Voir l’événement
                            </Button>
                        </Section>

                        <Hr style={{ borderColor: brand.border, margin: "24px 0" }} />

                        <Text style={{ marginTop: 0, fontSize: 12, color: brand.muted }}>
                            Si tu n’es pas à l’origine de cette action, ignore ce message.
                        </Text>
                    </Section>

                    <Text
                        style={{
                            marginTop: 12,
                            fontSize: 12,
                            color: brand.muted,
                            textAlign: "center",
                        }}
                    >
                        © {new Date().getFullYear()} Nalka
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}
