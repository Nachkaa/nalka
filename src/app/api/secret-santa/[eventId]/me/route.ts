import { NextResponse } from "next/server";

import { getSecretSantaMeView } from "@/features/secret-santa/server/queries/get-secret-santa-me-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { eventId: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { eventId } = await ctx.params;
    const data = await getSecretSantaMeView(eventId);

    if (!data) {
      return NextResponse.json({ error: "Aucun tirage" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";

    if (message === "Non authentifié") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (message === "Forbidden") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    if (message === "Not found") {
      return NextResponse.json({ error: "Module Secret Santa inactif" }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
