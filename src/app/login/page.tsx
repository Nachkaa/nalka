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

const SIGN_IN_ERROR_MESSAGES: Record<string, string> = {
  Verification: "Le lien de connexion a expire. Demandez-en un nouveau ci-dessous.",
  OAuthSignin: "Connexion Google indisponible pour le moment. Reessayez.",
  OAuthCallback: "Connexion Google indisponible pour le moment. Reessayez.",
  OAuthCreateAccount: "Connexion Google indisponible pour le moment. Reessayez.",
  AccessDenied: "La connexion Google a ete annulee.",
  AccountNotLinked:
    "Ce compte existe deja avec une autre methode. Utilisez le lien e-mail pour vous connecter.",
  OAuthAccountNotLinked:
    "Connexion Google impossible pour le moment. Reessayez dans un instant.",
  EmailSignin: "Envoi impossible. Verifiez l'adresse e-mail.",
  Callback: "Connexion impossible pour le moment. Reessayez.",
  Default: "Connexion impossible pour le moment. Reessayez.",
};

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
  return <LoginForm key={reset ? "reset" : "normal"} />;
}

function LoginForm() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = useMemo(() => searchParams.get("from") || "/event", [searchParams]);
  const hasExplicitFrom = useMemo(() => searchParams.has("from"), [searchParams]);

  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("auth:lastEmail") ?? "";
  });
  const [redirectTo, setRedirectTo] = useState(() => {
    if (typeof window === "undefined" || hasExplicitFrom) return from;
    return sessionStorage.getItem("auth:lastRedirect") ?? from;
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [helpNote, setHelpNote] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [isSending, startSend] = useTransition();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const tipsRef = useRef<HTMLDetailsElement | null>(null);

  const errorCode = useMemo(() => searchParams.get("error") ?? "", [searchParams]);
  const shouldFocus = searchParams.get("reset") === "1";
  const callbackTarget = redirectTo || from || "/event";

  useEffect(() => {
    if (!hasExplicitFrom) return;
    setRedirectTo(from);
    try {
      sessionStorage.setItem("auth:lastRedirect", from);
    } catch {
      // sessionStorage peut etre indisponible
    }
  }, [from, hasExplicitFrom]);

  useEffect(() => {
    if (!shouldFocus) return;
    requestAnimationFrame(() => emailInputRef.current?.focus());
  }, [shouldFocus]);

  useEffect(() => {
    if (status === "authenticated") router.replace(callbackTarget);
  }, [status, router, callbackTarget]);

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

  useEffect(() => {
    if (!errorCode) return;
    setError(SIGN_IN_ERROR_MESSAGES[errorCode] ?? SIGN_IN_ERROR_MESSAGES.Default);
  }, [errorCode]);

  const mailboxUrl = useMemo(() => resolveInboxUrl(email), [email]);
  const masked = useMemo(() => (email ? maskEmail(email) : ""), [email]);

  async function handleGoogleSignIn() {
    setError("");
    setIsGooglePending(true);

    try {
      const result = await signIn("google", {
        callbackUrl: callbackTarget,
        redirect: false,
      });

      if (result?.error) {
        setError(SIGN_IN_ERROR_MESSAGES[result.error] ?? SIGN_IN_ERROR_MESSAGES.Default);
        setIsGooglePending(false);
        return;
      }

      if (result?.url) {
        window.location.assign(result.url);
        return;
      }

      setError(SIGN_IN_ERROR_MESSAGES.Default);
    } catch {
      setError(SIGN_IN_ERROR_MESSAGES.Default);
    }

    setIsGooglePending(false);
  }

  function submit(form: HTMLFormElement) {
    setError("");
    const fd = new FormData(form);
    const provided = String(fd.get("email") || "").trim();
    const redirectValue = String(fd.get("redirectTo") || redirectTo || "");

    try {
      sessionStorage.setItem("auth:lastEmail", provided);
      if (redirectValue) sessionStorage.setItem("auth:lastRedirect", redirectValue);
    } catch {
      // sessionStorage peut etre indisponible
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
        setError("Envoi impossible. Verifiez l'adresse e-mail.");
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
      // ignore
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
      setError('Adresse manquante. Cliquez sur "Changer d\'e-mail".');
      return;
    }
    startSend(async () => {
      try {
        const result = await signIn("email", {
          email,
          redirect: false,
          callbackUrl: callbackTarget,
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
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Connexion</CardTitle>
              <CardDescription>
                Continuez avec Google pour acceder rapidement a vos evenements prives.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <Button
                type="button"
                className="h-11 w-full text-base"
                onClick={handleGoogleSignIn}
                disabled={isGooglePending || isSending}
                aria-busy={isGooglePending}
              >
                {isGooglePending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Redirection...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-3">
                    <GoogleIcon />
                    Continuer avec Google
                  </span>
                )}
              </Button>

              <div className="flex items-center gap-3">
                <div className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
                  ou par e-mail
                </span>
                <div className="bg-border h-px flex-1" />
              </div>

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(e.currentTarget);
                }}
                className="space-y-5 rounded-xl border border-dashed p-4"
              >
                <div className="grid gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="email">Lien magique e-mail</Label>
                    <p className="text-muted-foreground text-xs">
                      Option secondaire si vous ne souhaitez pas utiliser Google.
                    </p>
                  </div>
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
                    disabled={isSending || isGooglePending}
                  />
                </div>

                <input type="hidden" name="redirectTo" value={redirectTo} />

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isSending || isGooglePending}
                  className="h-11 w-full text-base"
                  aria-busy={isSending}
                >
                  {isSending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Envoi...
                    </span>
                  ) : (
                    "Recevoir un lien"
                  )}
                </Button>
              </form>

              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
            </CardContent>

            <CardFooter>
              <p className="text-muted-foreground w-full text-center text-xs">
                Nalka © {new Date().getFullYear()}
              </p>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="space-y-2 pb-4">
              {resendSuccess ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  E-mail renvoye.
                </div>
              ) : null}
              <CardTitle className="text-2xl">Lien envoye</CardTitle>
              <CardDescription>
                Si un compte existe pour cette adresse, un e-mail a ete envoye a{" "}
                <span className="text-foreground font-semibold">{masked || "cette adresse"}</span>.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Button type="button" className="h-11 w-full text-base" onClick={handleOpenMailbox}>
                  Ouvrir ma boite mail
                </Button>
                {!mailboxUrl && helpNote ? (
                  <p className="text-muted-foreground text-center text-sm">
                    Ouvrez votre messagerie et cherchez &quot;Connexion&quot;.
                  </p>
                ) : null}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                >
                  Changer d&apos;e-mail
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
                {error ? (
                  <p className="text-destructive text-center text-sm" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>

              <details
                ref={tipsRef}
                className="group border-border/60 bg-muted/40 rounded-lg border px-4 py-3"
              >
                <summary className="text-foreground cursor-pointer text-sm font-medium">
                  Pas de mail recu ?
                </summary>
                <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                  <li>- Spam / Indesirables</li>
                  <li>- Onglet Promotions (Gmail)</li>
                  <li>- Attendre 1-2 minutes</li>
                  <li>- Seul le dernier lien recu fonctionne</li>
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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M21.805 12.23c0-.68-.06-1.334-.173-1.962H12v3.713h5.5a4.703 4.703 0 0 1-2.04 3.085v2.56h3.3c1.93-1.777 3.045-4.395 3.045-7.396Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.075-.915 6.766-2.474l-3.3-2.56c-.915.614-2.086.977-3.466.977-2.658 0-4.91-1.794-5.715-4.206H2.873v2.64A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.285 13.737A5.997 5.997 0 0 1 5.965 12c0-.603.11-1.19.32-1.737v-2.64H2.873A10 10 0 0 0 2 12c0 1.61.386 3.134 1.073 4.377l3.212-2.64Z"
        fill="#FBBC04"
      />
      <path
        d="M12 6.057c1.5 0 2.846.516 3.907 1.53l2.93-2.93C17.07 3.012 14.755 2 12 2a10 10 0 0 0-9.127 5.623l3.412 2.64C7.09 7.851 9.342 6.057 12 6.057Z"
        fill="#EA4335"
      />
    </svg>
  );
}
