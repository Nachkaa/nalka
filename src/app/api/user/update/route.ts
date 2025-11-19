import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Non autorisé", { status: 401 });
  }

  const { name } = await req.json();

  const trimmed = (name ?? "").trim();
  if (trimmed.length < 2) {
    return new Response("Prénom invalide", { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: trimmed },
  });

  return new Response("ok");
}
