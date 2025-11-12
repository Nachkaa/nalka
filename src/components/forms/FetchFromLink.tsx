// CHANGE: remplace toujours le commentaire par la description reçue (pas d'ajout)

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";

type Props = {
  urlInputId: string;
  titleInputId: string;
  noteInputId: string;
};

export default function FetchFromLink({ urlInputId, titleInputId, noteInputId }: Props) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    const urlEl = document.getElementById(urlInputId) as HTMLInputElement | null;
    const titleEl = document.getElementById(titleInputId) as HTMLInputElement | null;
    const noteEl = document.getElementById(noteInputId) as HTMLTextAreaElement | null;
    if (!urlEl) return;

    const raw = urlEl.value?.trim();
    if (!raw) return;

    setPending(true);
    try {
      const res = await fetch("/api/url-meta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });
      const data: { url?: string; title?: string | null; description?: string | null } = await res.json();

      if (data.url && urlEl.value !== data.url) {
        urlEl.value = data.url;
        urlEl.dispatchEvent(new Event("input", { bubbles: true }));
      }

      if (data.title && titleEl) {
        titleEl.value = String(data.title).slice(0, 120);
        titleEl.dispatchEvent(new Event("input", { bubbles: true }));
      }

      // REMPLACEMENT pur du commentaire
      if (noteEl && typeof data.description === "string") {
        const next = data.description.slice(0, 500);
        if (noteEl.value !== next) {
          noteEl.value = next;
          noteEl.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Wand2 className="mr-2 h-3 w-3" />}
      Compléter depuis le lien
    </Button>
  );
}
