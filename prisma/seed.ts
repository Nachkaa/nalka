import { EventGiftMode, EventModuleKey, PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

// deterministic helpers
const rnd = crypto.createHash("sha256").update("nalka-seed-2025-v3").digest();
let i = 0;
const rbyte = () => rnd[i++ % rnd.length];
const rint = (min: number, max: number) => min + (rbyte() % (max - min + 1));
const choice = <T>(arr: T[]) => arr[rbyte() % arr.length];
function slugify(s: string) {
  const base =
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "event";
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}
const dateOnly = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

const MODULE_POSITIONS = {
  OVERVIEW: 0,
  GIFTS: 1,
  SECRET_SANTA: 2,
  POTLUCK: 3,
  TIMELINE: 4,
  EXPENSES: 5,
  POLLS: 6,
  CHAT: 7,
} as const;

const CORE_USERS = [
  { email: "aurele@example.com", name: "Aurele" },
  { email: "juliette@example.com", name: "Juliette" },
  { email: "maxime@example.com", name: "Maxime" },
];
const EXTRA = [
  "Marie",
  "Paul",
  "Lea",
  "Hugo",
  "Chloe",
  "Lucas",
  "Emma",
  "Nina",
  "Antoine",
  "Sophie",
];
const ITEM_BANK = [
  ["Montre connectee", 14900],
  ["Casque audio", 12900],
  ["Bougie parfume", 1900],
  ["Pull en laine", 6900],
  ["Carte cadeau", 3000],
  ["Sac a dos", 5900],
  ["Jeu de societe", 4200],
  ["Abonnement streaming", 999],
  ["Roman illustre", 2400],
  ["Tasse design", 1800],
];

async function main() {
  console.log("Reset...");
  await prisma.$transaction([
    prisma.reservation.deleteMany(),
    prisma.idea.deleteMany(),
    prisma.giftItem.deleteMany(),
    prisma.giftList.deleteMany(),
    prisma.eventInvite.deleteMany(),
    prisma.eventMember.deleteMany(),
    prisma.event.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("Users");
  const users = await prisma.$transaction(
    [
      ...CORE_USERS,
      ...EXTRA.map((n, idx) => ({ email: `${n.toLowerCase()}${idx}@example.com`, name: n })),
    ].map((u) => prisma.user.create({ data: u })),
  );

  const allIds = users.map((u) => u.id);
  const titles = ["Noel", "Anniversaire", "Nouvel An", "Cremaillere", "Fete", "Vacances"];
  const places = ["Maison", "Salon", "Nice", "Paris", "Lyon", "Restaurant"];

  console.log("Events");
  let count = 0;

  for (const owner of users) {
    const nEvents = rint(3, 5);
    for (let e = 0; e < nEvents; e++) {
      const title = `${choice(titles)} ${rint(1, 99)}`;
      const slug = slugify(title);
      const date = dateOnly(2025 + (rbyte() % 2), rint(1, 12), rint(1, 28));

      const giftMode = choice([EventGiftMode.HOST_LIST, EventGiftMode.PERSONAL_LISTS]);
      const giftSettings = {
        isNoSpoil: true,
        isAnonReservations: rbyte() % 5 === 0,
        isSecondHandOk: true,
        isHandmadeOk: true,
        budgetCapCents: rbyte() % 2 ? rint(2000, 5000) : null,
      } as const;

      const event = await prisma.event.create({
        data: {
          ownerId: owner.id,
          title,
          description: rbyte() % 3 ? null : "Evenement genere automatiquement",
          eventOn: date,
          location: choice(places),
          slug,
          linkEnabled: rbyte() % 2 === 0,
          colorHex: "#0ea5e9",
          budgetMode: rbyte() % 2 ? "FIXED" : "NONE",
          budgetCents: rbyte() % 2 ? rint(2000, 5000) : null,
          giftMode,
          scheduleMode: "EXACT",
          locationMode: "EXACT",
        },
        select: { id: true },
      });

      const pool = allIds.filter((id) => id !== owner.id);
      const memberCount = rint(3, 6);
      const memberIds = [owner.id];
      while (memberIds.length < memberCount + 1) {
        const next = choice(pool);
        if (!memberIds.includes(next)) memberIds.push(next);
      }

      await prisma.eventMember.create({
        data: { eventId: event.id, userId: owner.id, role: "OWNER" },
      });
      await prisma.eventMember.createMany({
        data: memberIds
          .filter((id) => id !== owner.id)
          .map((id) => ({
            eventId: event.id,
            userId: id,
            role: rbyte() % 5 === 0 ? "ADMIN" : "MEMBER",
          })),
      });

      const giftsEnabled = true; // seed choice: keep gifts on so gift lists make sense
      const secretSantaEnabled = rbyte() % 3 === 0; // ~33% events have secret santa, independent of gifts

      const moduleDefs: { key: EventModuleKey; enabled: boolean }[] = [
        { key: EventModuleKey.OVERVIEW, enabled: true },
        { key: EventModuleKey.GIFTS, enabled: giftsEnabled },
        { key: EventModuleKey.SECRET_SANTA, enabled: secretSantaEnabled },
        { key: EventModuleKey.POTLUCK, enabled: false },
        { key: EventModuleKey.TIMELINE, enabled: true },
        { key: EventModuleKey.EXPENSES, enabled: true },
        { key: EventModuleKey.POLLS, enabled: false },
        { key: EventModuleKey.CHAT, enabled: true },
      ];

      const modules = [] as { key: EventModuleKey; id: string }[];
      for (const mod of moduleDefs) {
        const created = await prisma.eventModule.create({
          data: {
            eventId: event.id,
            key: mod.key,
            enabled: mod.enabled,
            position: MODULE_POSITIONS[mod.key],
          },
          select: { id: true, key: true },
        });
        modules.push(created);
      }
      const moduleByKey = new Map(modules.map((m) => [m.key, m]));

      await prisma.eventOverviewSettings.create({
        data: { eventModuleId: moduleByKey.get(EventModuleKey.OVERVIEW)!.id, rsvpRequired: true },
      });
      await prisma.eventGiftsSettings.create({
        data: { eventModuleId: moduleByKey.get(EventModuleKey.GIFTS)!.id, ...giftSettings },
      });
      await prisma.eventSecretSantaSettings.create({
        data: { eventModuleId: moduleByKey.get(EventModuleKey.SECRET_SANTA)!.id },
      });
      await prisma.eventPotluckSettings.create({
        data: { eventModuleId: moduleByKey.get(EventModuleKey.POTLUCK)!.id },
      });
      await prisma.eventTimelineSettings.create({
        data: { eventModuleId: moduleByKey.get(EventModuleKey.TIMELINE)!.id },
      });
      await prisma.eventExpensesSettings.create({
        data: { eventModuleId: moduleByKey.get(EventModuleKey.EXPENSES)!.id },
      });
      await prisma.eventPollsSettings.create({
        data: { eventModuleId: moduleByKey.get(EventModuleKey.POLLS)!.id },
      });
      await prisma.eventChatSettings.create({
        data: { eventModuleId: moduleByKey.get(EventModuleKey.CHAT)!.id },
      });

      for (const uid of memberIds) {
        const list = await prisma.giftList.create({
          data: {
            ownerId: uid,
            eventId: event.id,
            title: `Liste de ${users.find((u) => u.id === uid)?.name ?? "Invite"}`,
          },
          select: { id: true, ownerId: true },
        });

        const nItems = rint(5, 8);
        const membersExcl = memberIds.filter((m) => m !== uid);
        const items = [] as { id: string }[];
        for (let j = 0; j < nItems; j++) {
          const [name, price] = choice(ITEM_BANK);
          const item = await prisma.giftItem.create({
            data: {
              listId: list.id,
              title: `${name} ${rint(1, 50)}`,
              url: rbyte() % 2 ? `https://example.com/${slug}/${j}` : null,
              priceCents: rbyte() % 3 ? Number(price) : null,
              note: rbyte() % 2 ? "idee sympa" : null,
            },
            select: { id: true },
          });
          items.push(item);
        }

        for (const it of items) {
          if (rbyte() % 2) continue;
          const resCount = rint(1, Math.min(2, membersExcl.length));
          const picked = new Set<string>();
          while (picked.size < resCount) picked.add(choice(membersExcl));
          for (const by of picked) {
            await prisma.reservation.create({
              data: {
                itemId: it.id,
                byUserId: by,
                status: choice(["RESERVED", "PURCHASED", "RELEASED"]),
                anonymous: rbyte() % 3 === 0,
              },
            });
          }
        }

        for (const it of items) {
          if (rbyte() % 5) continue;
          await prisma.idea.create({
            data: {
              itemId: it.id,
              byUserId: choice(memberIds),
              text: "Variante possible",
              anonymous: true,
            },
          });
        }
      }

      const nInv = rint(0, 3);
      for (let k = 0; k < nInv; k++) {
        await prisma.eventInvite.create({
          data: {
            eventId: event.id,
            email: `invite${rint(1000, 9999)}@example.com`,
            role: "MEMBER",
            token: crypto.randomBytes(10).toString("base64url"),
            status: "PENDING",
            invitedById: owner.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
          },
        });
      }

      count++;
    }
  }

  console.log(`Seeded ${count} events (${users.length} users).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
