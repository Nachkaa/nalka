"use server";

import { render } from "@react-email/render";
import { EventModuleKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import SecretSantaAssignedEmail from "@/emails/SecretSantaAssignedEmail";
import { requireEnabledModule } from "@/features/events/access";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

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

  if (ids.length <= 1 || ids.some((id, index) => id === receivers[index])) {
    throw new Error("Tirage impossible : nombre de participants insuffisant.");
  }

  return receivers;
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
  const parsed = Input.safeParse({
    eventId: formData.get("eventId"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) throw new Error("Champs requis");

  const { eventId } = parsed.data;
  const access = await requireEnabledModule({
    eventId,
    key: EventModuleKey.SECRET_SANTA,
    requireOrganizer: true,
  });

  const eventRow = await prisma.event.findUnique({
    where: { id: access.event.id },
    select: {
      title: true,
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

  const participants = eventRow.memberships
    .map((membership) => membership.user)
    .filter((user): user is NonNullable<typeof user> => Boolean(user));

  const participantIds = participants.map((participant) => participant.id);
  if (participantIds.length < 2) {
    throw new Error("Au moins 2 participants requis");
  }

  const receivers = makeDerangement(participantIds);
  const receiversByGiver = new Map<string, string>();
  participantIds.forEach((giverId, index) => {
    receiversByGiver.set(giverId, receivers[index]);
  });

  await prisma.$transaction(async (tx) => {
    await tx.secretSantaAssignment.deleteMany({ where: { eventId: access.event.id } });
    await tx.secretSantaAssignment.createMany({
      data: participantIds.map((giverId) => ({
        eventId: access.event.id,
        giverId,
        receiverId: receiversByGiver.get(giverId)!,
      })),
    });
  });

  const baseUrl =
    process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const byId = new Map(participants.map((participant) => [participant.id, participant]));

  for (const giver of participants) {
    const receiverId = receiversByGiver.get(giver.id);
    if (!receiverId) continue;

    const receiver = byId.get(receiverId);
    if (!giver.email || !receiver) continue;

    try {
      const html = await render(
        SecretSantaAssignedEmail({
          eventTitle: eventRow.title,
          eventUrl: `${baseUrl}/event/${access.event.slug}`,
          giverName: giver.name ?? giver.email,
          receiverName: receiver.name ?? "un proche",
        }),
      );

      await sendMail({
        to: giver.email,
        subject: `Ton tirage Secret Santa pour ${eventRow.title}`,
        html,
      });
    } catch (error) {
      console.error("[SecretSanta] Échec d’envoi de mail pour", giver.email, error);
    }
  }

  revalidatePath(`/event/${access.event.slug}`);
}

export async function setSecretSantaBudget(formData: FormData) {
  const parsed = BudgetInput.safeParse({
    eventId: formData.get("eventId"),
    slug: formData.get("slug"),
    budgetEuro: formData.get("budgetEuro")?.toString(),
  });
  if (!parsed.success) throw new Error("Champs requis");

  const { eventId, budgetEuro } = parsed.data;
  const access = await requireEnabledModule({
    eventId,
    key: EventModuleKey.SECRET_SANTA,
    requireOrganizer: true,
  });

  const budgetCapCents = parseBudgetEuroToCents(budgetEuro);

  await prisma.eventSecretSantaSettings.upsert({
    where: { eventModuleId: access.eventModule.id },
    update: { budgetCapCents },
    create: { eventModuleId: access.eventModule.id, budgetCapCents },
  });

  revalidatePath(`/event/${access.event.slug}`);
  return { ok: true, budgetCapCents };
}
