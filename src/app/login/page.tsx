// app/login/page.tsx
"use client";

import { Suspense, useEffect, useMemo, useState, useRef, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink } from "./actions";
import { Loader2 } from "lucide-react";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSending, startSend] = useTransition();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const from = useMemo(() => searchParams.get("from") || "/event", [searchParams]);

  // 👇 nouveau : on récupère le code d’erreur renvoyé par NextAuth
  const errorCode = useMemo(() => searchParams.get("error") ?? "", [searchParams]);
  const verificationFailed = errorCode === "Verification";

  useEffect(() => {
    if (status === "authenticated") router.replace("/event");
  }, [status, router]);

  useEffect(() => {
    if (searchParams.get("reset") === "1") {
      setSent(false);
      setError("");
      requestAnimationFrame(() => emailInputRef.current?.focus());
    }
  }, [searchParams]);

  const mailboxUrl = useMemo(() => {
    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    if (domain.includes("gmail")) return "https://mail.google.com/";
    if (domain.includes("outlook") || domain.includes("live") || domain.includes("hotmail")) return "https://outlook.live.com/";
    if (domain.includes("office") || domain.includes("microsoft")) return "https://outlook.office.com/";
    if (domain.includes("yahoo")) return "https://mail.yahoo.com/";
    if (domain.includes("proton")) return "https://mail.proton.me/";
    if (domain.includes("icloud") || domain.includes("me.com")) return "https://www.icloud.com/mail/";
    return "";
  }, [email]);

  async function action(formData: FormData) {
    setError("");
    const provided = String(formData.get("email") || "");
    startSend(async () => {
      try {
        await sendMagicLink(formData);
        setEmail(provided);
        setSent(true);
      } catch {
        setError("Envoi impossible. Vérifiez l’adresse.");
        setSent(false);
      }
    });
  }

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </main>
    );
  }
  if (status === "authenticated") return null;

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        {!sent ? (
          <>
            {/* 👇 nouveau : message spécifique si le lien NextAuth est expiré / déjà utilisé */}
            {verificationFailed && (
              <div className="mx-6 mt-6 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                Le lien de connexion n’est plus valide (déjà utilisé ou expiré).
                Demandez simplement un nouveau lien ci-dessous.
              </div>
            )}

            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Connexion</CardTitle>
              <CardDescription>
                Entrez votre e-mail. Nous vous enverrons un lien sécurisé.
              </CardDescription>
            </CardHeader>

            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                const fd = new FormData(e.currentTarget);
                const provided = String(fd.get("email") || "");
                startSend(async () => {
                  try {
                    await sendMagicLink(fd);
                    setEmail(provided);
                    setSent(true);
                  } catch {
                    setError("Envoi impossible. Vérifiez l’adresse.");
                    setSent(false);
                  }
                });
              }}
              action={action}
            >
              <CardContent className="space-y-8">
                <div className="grid gap-4">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    ref={emailInputRef}
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="vous@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 text-base"
                    disabled={isSending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Aucun mot de passe. Vous recevrez un lien de connexion.
                  </p>
                </div>
                <input type="hidden" name="redirectTo" value={from} />
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
              </CardContent>

              <CardFooter className="grid gap-5">
                <Button
                  type="submit"
                  disabled={isSending}
                  className="h-11 w-full text-base"
                  aria-busy={isSending}
                >
                  {isSending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Envoi…
                    </span>
                  ) : (
                    "Recevoir le lien"
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Nalka © {new Date().getFullYear()}
                </p>
              </CardFooter>
            </form>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Lien envoyé</CardTitle>
              <CardDescription>
                Un e-mail a été envoyé à{" "}
                <span className="font-medium text-foreground">{email}</span>. Ouvrez-le pour vous connecter.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {mailboxUrl ? (
                <a href={mailboxUrl} target="_blank" rel="noopener noreferrer">
                  <Button type="button" className="w-full h-11 text-base">
                    Ouvrir ma boîte mail
                  </Button>
                </a>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Vérifiez votre boîte mail et vos spams.
                </p>
              )}

              <div className="grid gap-2 mt-2">
                <p className="text-sm text-muted-foreground text-center">
                  Pas de mail reçu ?
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setError("");
                    requestAnimationFrame(() => emailInputRef.current?.focus());
                  }}
                  className="w-full h-11 text-base"
                >
                  Renvoyer le lien
                </Button>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center" role="alert">
                  {error}
                </p>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
