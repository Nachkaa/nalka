"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateEventEmailDomains } from "@/features/events/actions/email-domain-access";
import { EventEmailDomainFields } from "@/features/events/components/EventEmailDomainFields";

export function EventEmailDomainForm({
  slug,
  allowedEmailDomains,
}: {
  slug: string;
  allowedEmailDomains: string[];
}) {
  const router = useRouter();
  const [value, setValue] = useState({
    enabled: allowedEmailDomains.length > 0,
    domains: allowedEmailDomains,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        const formData = new FormData();
        formData.set("access.restrictEmailDomains", value.enabled ? "on" : "");
        for (const domain of value.domains) formData.append("access.allowedEmailDomains", domain);
        startTransition(async () => {
          try {
            await updateEventEmailDomains(slug, formData);
            setMessage(
              "Les règles d’accès ont été enregistrées. Les liens existants utilisent ces règles.",
            );
            router.refresh();
          } catch {
            setError(
              "Impossible d’enregistrer les règles d’accès. Vérifiez vos droits et réessayez.",
            );
          }
        });
      }}
    >
      <EventEmailDomainFields
        enabled={value.enabled}
        domains={value.domains}
        disabled={pending}
        onChange={(next) => {
          setValue(next);
          setMessage("");
          setError("");
        }}
      />
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <p role="status" className="text-muted-foreground text-sm">
        {message}
      </p>
      <Button type="submit" disabled={pending || (value.enabled && value.domains.length === 0)}>
        {pending ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
        {pending ? "Enregistrement…" : "Enregistrer les accès"}
      </Button>
    </form>
  );
}
