"use server";

import { render } from "@react-email/render";
import { EventModuleKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import SecretSantaAssignedEmail from "@/emails/SecretSantaAssignedEmail";
import { requireEnabledModule } from "@/features/events/access";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

import { withDrawLock } from "./draw-lock";
import { readDrawRevision } from "./draw-revision";

const Input = z.object({
  eventId: z.string().min(1),
  slug: z.string().min(1),
  confirmReplace: z.boolean(),
  expectedRevision: z.string().regex(/^(none|[a-f0-9]{64})$/),
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

type DrawResult =
  | { status: "busy" }
  | { status: "stale"; drawRevision: string }
  | { status: "requiresConfirmation"; drawRevision: string }
  | { status: "completed"; drawRevision: string; notificationFailures: number };

export async function launchDraw(formData: FormData): Promise<DrawResult> {
  const parsed = Input.safeParse({
    eventId: formData.get("eventId"),
    slug: formData.get("slug"),
    confirmReplace: formData.get("confirmReplace") === "true",
    expectedRevision: formData.get("expectedRevision"),
  });
  if (!parsed.success) throw new Error("Actualise la page avant de lancer le tirage.");

  const access = await requireEnabledModule({
    eventId: parsed.data.eventId,
    key: EventModuleKey.SECRET_SANTA,
    requireOrganizer: true,
  });

  const result = await withDrawLock(
    access.event.id,
    async ({ assertHeld }): Promise<DrawResult> => {
      const draw = await prisma.$transaction(async (tx) => {
        // Serialize the revision check and writes even if the lock session disconnects.
        const modules = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "EventModule" WHERE "id" = ${access.eventModule.id} AND "enabled" = TRUE FOR UPDATE`;
        if (!modules.length) throw new Error("Module Secret Santa inactif");
        const currentRevision = await readDrawRevision(access.event.id, tx);
        if (currentRevision !== parsed.data.expectedRevision) {
          return { status: "stale" as const, drawRevision: currentRevision };
        }
        if (currentRevision !== "none" && !parsed.data.confirmReplace) {
          return { status: "requiresConfirmation" as const, drawRevision: currentRevision };
        }

        const eventRow = await tx.event.findUnique({
          where: { id: access.event.id },
          select: {
            title: true,
            memberships: { select: { user: { select: { id: true, email: true, name: true } } } },
          },
        });
        if (!eventRow) throw new Error("Événement introuvable");
        const participants = eventRow.memberships.map(({ user }) => user);
        const participantIds = participants.map(({ id }) => id);
        if (participantIds.length < 2) throw new Error("Au moins 2 participants requis");
        const receivers = makeDerangement(participantIds);
        const receiversByGiver = new Map(participantIds.map((id, index) => [id, receivers[index]]));

        await assertHeld();
        await tx.secretSantaAssignment.deleteMany({ where: { eventId: access.event.id } });
        await tx.secretSantaAssignment.createMany({
          data: participantIds.map((giverId) => ({
            eventId: access.event.id,
            giverId,
            receiverId: receiversByGiver.get(giverId)!,
          })),
        });
        const revision = await readDrawRevision(access.event.id, tx);
        await assertHeld();
        return {
          status: "saved" as const,
          participants,
          receiversByGiver,
          title: eventRow.title,
          revision,
        };
      });
      if (draw.status !== "saved") return draw;

      const baseUrl =
        process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const byId = new Map(draw.participants.map((participant) => [participant.id, participant]));
      let notificationFailures = 0;
      for (const giver of draw.participants) {
        const receiver = byId.get(draw.receiversByGiver.get(giver.id)!);
        if (!giver.email || !receiver) continue;
        try {
          const html = await render(
            SecretSantaAssignedEmail({
              eventTitle: draw.title,
              eventUrl: `${baseUrl}/event/${access.event.slug}`,
              giverName: giver.name ?? giver.email,
              receiverName: receiver.name?.trim() || receiver.email || "un proche",
            }),
          );
          await assertHeld();
          await sendMail({
            to: giver.email,
            subject: `Ton tirage Secret Santa pour ${draw.title}`,
            html,
          });
        } catch {
          notificationFailures += 1;
          console.error("[SecretSanta] Une notification n'a pas pu être confirmée.");
        }
      }
      revalidatePath(`/event/${access.event.slug}`);
      return { status: "completed", drawRevision: draw.revision, notificationFailures };
    },
  );
  return result ?? { status: "busy" };
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
