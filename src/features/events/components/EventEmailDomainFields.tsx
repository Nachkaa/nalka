"use client";

import { useId, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmailDomainSchema } from "@/features/events/email-domain-policy";

type Props = {
  enabled: boolean;
  domains: string[];
  onChange: (value: { enabled: boolean; domains: string[] }) => void;
  disabled?: boolean;
};

export function EventEmailDomainFields({ enabled, domains, onChange, disabled }: Props) {
  const id = useId();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  function addDomain() {
    const parsed = EmailDomainSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (domains.includes(parsed.data)) {
      setError("Ce domaine est déjà autorisé.");
      return;
    }
    if (domains.length >= 20) {
      setError("Vous pouvez autoriser jusqu’à 20 domaines.");
      return;
    }
    onChange({ enabled, domains: [...domains, parsed.data] });
    setInput("");
    setError("");
  }

  return (
    <fieldset disabled={disabled} className="space-y-4 rounded-xl border p-4">
      <legend className="px-1 text-base font-medium">Accès et invitations</legend>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor={`${id}-enabled`}>Limiter les domaines e-mail</Label>
          <p id={`${id}-help`} className="text-muted-foreground text-sm">
            Pour rejoindre via le lien partagé, les participants devront vérifier une adresse
            appartenant à un domaine autorisé.
          </p>
        </div>
        <Switch
          id={`${id}-enabled`}
          checked={enabled}
          disabled={disabled}
          aria-describedby={`${id}-help`}
          onCheckedChange={(checked) => {
            setError("");
            onChange({ enabled: checked, domains });
          }}
        />
      </div>

      {enabled ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" aria-label="Domaines autorisés">
            {domains.map((domain) => (
              <span
                key={domain}
                className="bg-secondary inline-flex max-w-full items-center rounded-lg pl-3 text-sm"
              >
                <span className="break-all">@{domain}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0"
                  aria-label={`Retirer ${domain}`}
                  disabled={disabled}
                  onClick={() =>
                    onChange({ enabled, domains: domains.filter((item) => item !== domain) })
                  }
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </span>
            ))}
          </div>
          <Label htmlFor={`${id}-domain`}>Ajouter un domaine autorisé</Label>
          <div className="flex items-center gap-2">
            <Input
              id={`${id}-domain`}
              value={input}
              placeholder="departement06.fr"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={`${id}-feedback`}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addDomain();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addDomain} disabled={disabled}>
              Ajouter
            </Button>
          </div>
          <div id={`${id}-feedback`} aria-live="polite">
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
            {!error && domains.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Ajoutez au moins un domaine pour activer la restriction.
              </p>
            ) : null}
          </div>
          <p className="text-muted-foreground flex items-start gap-2 text-sm">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Le domaine doit correspondre exactement. Les sous-domaines ne sont pas inclus.
          </p>
          <details className="text-muted-foreground text-sm">
            <summary className="cursor-pointer">Et les intervenants externes ?</summary>
            <p className="mt-2">
              Un organisateur peut inviter une adresse précise par e-mail, même en dehors de ces
              domaines. Les personnes déjà membres conservent leur accès.
            </p>
          </details>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Toute personne disposant d’un lien valide peut rejoindre l’événement après connexion.
        </p>
      )}
    </fieldset>
  );
}
