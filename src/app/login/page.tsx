// FILE: src/app/login/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveInboxUrl } from "@/lib/auth/inboxProviders";
import { maskEmail } from "@/lib/auth/maskEmail";
import { Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, useTransition } from "react";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center">
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </main>
      }
    >
      <LoginFormShell />
    </Suspense>
  );
}

function LoginFormShell() {
  const searchParams = useSearchParams();
  const reset = searchParams.get("reset") === "1";
  // Remount quand reset=1 => état remis à zéro sans setState dans un effect
  return <LoginForm key={reset ? "reset" : "normal"} />;
}

function LoginForm() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = useMemo(() => searchParams.get("from") || "/event", [searchParams]);

  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("auth:lastEmail") ?? "";
  });
  const [redirectTo, setRedirectTo] = useState(() => {
    if (typeof window === "undefined") return from;
    return sessionStorage.getItem("auth:lastRedirect") ?? from;
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [helpNote, setHelpNote] = useState(false);
  const [isSending, startSend] = useTransition();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const tipsRef = useRef<HTMLDetailsElement | null>(null);

  const errorCode = useMemo(() => searchParams.get("error") ?? "", [searchParams]);
  const verificationFailed = errorCode === "Verification";

  const shouldFocus = searchParams.get("reset") === "1";
  useEffect(() => {
    if (!shouldFocus) return;
    requestAnimationFrame(() => emailInputRef.current?.focus());
  }, [shouldFocus]);

  useEffect(() => {
    if (status === "authenticated") router.replace("/event");
  }, [status, router]);

  useEffect(() => {
    if (!sent || cooldown === 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sent, cooldown]);

  const mailboxUrl = useMemo(() => resolveInboxUrl(email), [email]);
  const masked = useMemo(() => (email ? maskEmail(email) : ""), [email]);

  function submit(form: HTMLFormElement) {
    setError("");
    const fd = new FormData(form);
    const provided = String(fd.get("email") || "").trim();
    const redirectValue = String(fd.get("redirectTo") || redirectTo || "");

    try {
      sessionStorage.setItem("auth:lastEmail", provided);
      if (redirectValue) sessionStorage.setItem("auth:lastRedirect", redirectValue);
    } catch {
      // sessionStorage peut être indisponible (mode privé, etc.)
    }

    startSend(async () => {
      try {
        const result = await signIn("email", {
          email: provided,
          redirect: false,
          callbackUrl: redirectValue || "/event",
        });
        if (!result || result.error) throw new Error(result?.error ?? "SIGNIN_FAILED");
        setEmail(provided);
        setSent(true);
        setCooldown(60);
        setResendSuccess(false);
        setHelpNote(false);
        setRedirectTo(redirectValue || "/event");
      } catch {
        setError("Envoi impossible. Vérifiez l’adresse.");
        setSent(false);
      }
    });
  }

  const handleOpenMailbox = () => {
    if (mailboxUrl) {
      window.open(mailboxUrl, "_blank", "noreferrer");
      return;
    }
    setHelpNote(true);
    tipsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleChangeEmail = () => {
    try {
      sessionStorage.removeItem("auth:lastEmail");
      sessionStorage.removeItem("auth:lastRedirect");
    } catch {
      /* ignore */
    }
    setSent(false);
    setCooldown(0);
    setResendSuccess(false);
    setError("");
    setHelpNote(false);
    setEmail("");
    router.replace("/login?reset=1");
    requestAnimationFrame(() => emailInputRef.current?.focus());
  };

  const handleResend = () => {
    setError("");
    setResendSuccess(false);
    if (!email) {
      setError('Adresse manquante. Cliquez sur "Changer d’e-mail".');
      return;
    }
    startSend(async () => {
      try {
        const result = await signIn("email", {
          email,
          redirect: false,
          callbackUrl: redirectTo || from || "/event",
        });
        if (!result || result.error) throw new Error(result?.error ?? "SIGNIN_FAILED");
        setCooldown(60);
        setResendSuccess(true);
      } catch {
        setError("Impossible de renvoyer le lien pour le moment.");
      }
    });
  };

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-muted-foreground text-sm">Chargement...</p>
      </main>
    );
  }
  if (status === "authenticated") return null;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <Card className="w-full max-w-md rounded-2xl bg-white! shadow-lg">
        {!sent ? (
          <>
            {verificationFailed && (
              <div className="border-destructive/40 bg-destructive/10 text-destructive mx-6 mt-6 rounded-md border p-3 text-sm">
                Le lien de connexion n’est plus valide (déjà utilisé ou expiré). Demandez simplement
                un nouveau lien ci-dessous.
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
                submit(e.currentTarget);
              }}
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
                  <p className="text-muted-foreground text-xs">
                    Aucun mot de passe. Vous recevrez un lien de connexion.
                  </p>
                </div>

                <input type="hidden" name="redirectTo" value={redirectTo} />

                {error && (
                  <p className="text-destructive text-sm" role="alert">
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
                      Envoi...
                    </span>
                  ) : (
                    "Recevoir le lien"
                  )}
                </Button>

                <p className="text-muted-foreground text-center text-xs">
                  Nalka © {new Date().getFullYear()}
                </p>
              </CardFooter>
            </form>
          </>
        ) : (
          <>
            <CardHeader className="space-y-2 pb-4">
              {resendSuccess && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  E-mail renvoyé.
                </div>
              )}
              <CardTitle className="text-2xl">Lien envoyé</CardTitle>
              <CardDescription>
                Si un compte existe pour cette adresse, un e-mail a été envoyé à
                <span className="text-foreground font-semibold">{masked || "cette adresse"}</span>.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Button type="button" className="h-11 w-full text-base" onClick={handleOpenMailbox}>
                  Ouvrir ma boîte mail
                </Button>
                {!mailboxUrl && helpNote && (
                  <p className="text-muted-foreground text-center text-sm">
                    Ouvrez votre messagerie et cherchez &quot;Connexion&quot;.
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                >
                  Changer d’e-mail
                </button>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={cooldown > 0 || isSending}
                  className="h-11 w-full text-base"
                  onClick={handleResend}
                >
                  {isSending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Envoi...
                    </span>
                  ) : cooldown > 0 ? (
                    `Renvoyer dans ${cooldown}s`
                  ) : (
                    "Renvoyer le lien"
                  )}
                </Button>
                {error && (
                  <p className="text-destructive text-center text-sm" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <details
                ref={tipsRef}
                className="group border-border/60 bg-muted/40 rounded-lg border px-4 py-3"
              >
                <summary className="text-foreground cursor-pointer text-sm font-medium">
                  Pas de mail reçu ?
                </summary>
                <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                  <li>- Spam / Indésirables</li>
                  <li>- Onglet Promotions (Gmail)</li>
                  <li>- Attendre 1-2 minutes</li>
                  <li>- Seul le dernier lien reçu fonctionne</li>
                  <li>- Rechercher &quot;connexion&quot; + nom de l&apos;app</li>
                </ul>
              </details>
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
