"use server";

import { auth } from "@/auth";
import SecretSantaAssignedEmail from "@/emails/SecretSantaAssignedEmail";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { EventModuleKey } from "@prisma/client";
import { render } from "@react-email/render";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const Input = z.object({
  eventId: z.string().min(1),
  slug: z.string().min(1),
});
const BudgetInput = z.object({
  eventId: z.string().min(1),
  slug: z.string().min(1),
  budgetEuro: z.string().optional(),
});

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function makeDerangement(ids: string[]): string[] {
  const receivers = [...ids];
  shuffleInPlace(receivers);

  for (let i = 0; i < ids.length; i++) {
    if (ids[i] === receivers[i]) {
      const j = (i + 1) % ids.length;
      [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
    }
  }

  if (ids.length <= 1 || ids.some((id, i) => id === receivers[i])) {
    throw new Error("Tirage impossible : nombre de participants insuffisant.");
  }

  return receivers;
}

async function assertAdmin(eventId: string, userEmail: string) {
  const me = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (!me) throw new Error("Utilisateur introuvable");

  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new Error("Interdit");
  }

  return me.id;
}

function parseBudgetEuroToCents(raw: string | undefined): number | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  if (!/^\d+$/.test(value)) {
    throw new Error("Le budget doit être un nombre entier (euros).");
  }

  const euros = Number.parseInt(value, 10);
  const clamped = Math.max(5, Math.min(500, euros));
  return clamped * 100;
}

export async function launchDraw(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const parsed = Input.safeParse({
    eventId: formData.get("eventId"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) throw new Error("Champs requis");

  const { eventId, slug } = parsed.data;

  await assertAdmin(eventId, session.user.email);

  // On récupère l’événement + les membres (comptes utilisateur, pas les proches)
  const eventRow = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      title: true,
      modules: {
        where: { key: EventModuleKey.SECRET_SANTA },
        select: { enabled: true },
        take: 1,
      },
      memberships: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });
  if (!eventRow) throw new Error("Événement introuvable");

  const secretSantaEnabled = eventRow.modules[0]?.enabled === true;
  if (!secretSantaEnabled) {
    throw new Error("Le module Secret Santa n'est pas activé.");
  }

  const participants = eventRow.memberships
    .map((m) => m.user)
    .filter((u) => u !== null && u !== undefined);

  const participantIds = participants.map((p) => p.id);
  if (participantIds.length < 2) {
    throw new Error("Au moins 2 participants requis");
  }

  const receivers = makeDerangement(participantIds);

  const receiversByGiver = new Map<string, string>();
  participantIds.forEach((giverId, idx) => {
    receiversByGiver.set(giverId, receivers[idx]);
  });

  // Transaction : on enregistre le tirage
  await prisma.$transaction(async (tx) => {
    await tx.secretSantaAssignment.deleteMany({ where: { eventId } });
    await tx.secretSantaAssignment.createMany({
      data: participantIds.map((giverId) => ({
        eventId,
        giverId,
        receiverId: receiversByGiver.get(giverId)!,
      })),
    });
  });

  // Envoi des mails (hors transaction, et surtout *robuste*)
  const baseUrl =
    process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const byId = new Map(participants.map((p) => [p.id, p]));

  for (const giver of participants) {
    const receiverId = receiversByGiver.get(giver.id);
    if (!receiverId) continue;

    const receiver = byId.get(receiverId);
    if (!giver.email || !receiver) continue;

    try {
      const html = await render(
        SecretSantaAssignedEmail({
          eventTitle: eventRow.title,
          eventUrl: `${baseUrl}/event/${slug}`,
          giverName: giver.name ?? giver.email,
          receiverName: receiver.name ?? "un proche",
        }),
      );

      await sendMail({
        to: giver.email,
        subject: `Ton tirage Secret Santa pour ${eventRow.title}`,
        html,
      });
    } catch (err) {
      console.error("[SecretSanta] Échec d’envoi de mail pour", giver.email, err);
      // On ignore : le tirage reste valide, l’UI ne doit pas crasher
    }
  }

  revalidatePath(`/event/${slug}`);
}

export async function setSecretSantaBudget(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const parsed = BudgetInput.safeParse({
    eventId: formData.get("eventId"),
    slug: formData.get("slug"),
    budgetEuro: formData.get("budgetEuro")?.toString(),
  });
  if (!parsed.success) throw new Error("Champs requis");

  const { eventId, slug, budgetEuro } = parsed.data;
  await assertAdmin(eventId, session.user.email);

  const budgetCapCents = parseBudgetEuroToCents(budgetEuro);

  const moduleRow = await prisma.eventModule.findUnique({
    where: { eventId_key: { eventId, key: EventModuleKey.SECRET_SANTA } },
    select: { id: true, enabled: true },
  });
  if (!moduleRow || !moduleRow.enabled) {
    throw new Error("Module Secret Santa inactif.");
  }

  await prisma.eventSecretSantaSettings.upsert({
    where: { eventModuleId: moduleRow.id },
    update: { budgetCapCents },
    create: { eventModuleId: moduleRow.id, budgetCapCents },
  });

  revalidatePath(`/event/${slug}`);
  return { ok: true, budgetCapCents };
}
