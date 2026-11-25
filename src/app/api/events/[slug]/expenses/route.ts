import { getCurrentUser } from "@/lib/session";
import { getSharedBudget, SharedBudgetError } from "@/features/budget/shared/server/ledger";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const headers = { "Cache-Control": "private, no-store" };
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Non authentifié" }, { status: 401, headers });
  try {
    const { slug } = await params;
    return Response.json(await getSharedBudget(slug, user.userId), { headers });
  } catch (error) {
    return Response.json(
      { error: "Budget indisponible" },
      {
        status: error instanceof SharedBudgetError ? error.status : 500,
        headers,
      },
    );
  }
}
