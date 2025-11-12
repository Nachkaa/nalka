/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

// --- utils deterministic ---
const rnd = crypto.createHash("sha256").update("nalka-seed-2025-v2").digest();
let i = 0;
const rbyte = () => rnd[i++ % rnd.length];
const rint = (min: number, max: number) => min + (rbyte() % (max - min + 1));
const choice = <T>(arr: T[]) => arr[rbyte() % arr.length];
function slugify(s: string) {
  const base = s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "event";
  // Ajoute une valeur aléatoire courte pour garantir unicité
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}
const dateOnly = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

// --- data sources ---
const CORE_USERS = [
  { email: "aurele@example.com", name: "Aurèle" },
  { email: "juliette@example.com", name: "Juliette" },
  { email: "maxime@example.com", name: "Maxime" },
];
const EXTRA = ["Marie", "Paul", "Léa", "Hugo", "Chloé", "Lucas", "Emma", "Nina", "Antoine", "Sophie"];
const ITEM_BANK = [
  ["Montre connectée", 14900],
  ["Casque audio", 12900],
  ["Bougie parfumée", 1900],
  ["Pull en laine", 6900],
  ["Carte cadeau", 3000],
  ["Sac à dos", 5900],
  ["Jeu de société", 4200],
  ["Abonnement streaming", 999],
  ["Roman illustré", 2400],
  ["Tasse design", 1800],
];

// --- main ---
async function main() {
  console.log("🧹 Reset...");
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

  console.log("👥 Users");
  const users = await prisma.$transaction([
    ...CORE_USERS,
    ...EXTRA.map((n, i) => ({ email: `${n.toLowerCase()}${i}@example.com`, name: n })),
  ].map(u => prisma.user.create({ data: u })));

  const allIds = users.map(u => u.id);
  console.log(`→ ${users.length} users`);

  const titles = ["Noël", "Anniversaire", "Nouvel An", "Crémaillère", "Fête", "Vacances"];
  const places = ["Maison", "Salon", "Nice", "Paris", "Lyon", "Restaurant"];

  console.log("🎁 Events");
  let count = 0;

  for (const owner of users) {
    const nEvents = rint(3, 5);
    for (let e = 0; e < nEvents; e++) {
      const title = `${choice(titles)} ${rint(1, 99)}`;
      const slug = slugify(title);
      const date = dateOnly(2025 + (rbyte() % 2), rint(1, 12), rint(1, 28));

      const event = await prisma.event.create({
        data: {
          ownerId: owner.id,
          title,
          description: rbyte() % 3 ? null : "Événement généré automatiquement",
          eventOn: date,
          location: choice(places),
          slug: slugify(title),
          linkEnabled: rbyte() % 2 === 0,
          colorHex: "#0ea5e9",
          budgetMode: rbyte() % 2 ? "FIXED" : "NONE",
          budgetCents: rbyte() % 2 ? rint(2000, 5000) : null,
          isNoSpoil: true,
          isAnonReservations: rbyte() % 5 === 0,
          isSecondHandOk: true,
          isHandmadeOk: true,
          settings: { spoilerSafe: true },
        },
        select: { id: true },
      });

      // --- members
      const pool = allIds.filter(id => id !== owner.id);
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
          .filter(id => id !== owner.id)
          .map(id => ({ eventId: event.id, userId: id, role: rbyte() % 5 === 0 ? "ADMIN" : "MEMBER" }))
      });

      // --- lists + items + reservat ions + ideas
      for (const uid of memberIds) {
        const list = await prisma.giftList.create({
          data: {
            ownerId: uid,
            eventId: event.id,
            title: `Liste de ${users.find(u => u.id === uid)?.name ?? "Invité"}`,
          },
          select: { id: true, ownerId: true },
        });

        const nItems = rint(5, 8);
        const membersExcl = memberIds.filter(m => m !== uid);
        const items = [];
        for (let j = 0; j < nItems; j++) {
          const [name, price] = choice(ITEM_BANK);
          const item = await prisma.giftItem.create({
            data: {
              listId: list.id,
              title: `${name} ${rint(1, 50)}`,
              url: rbyte() % 2 ? `https://example.com/${slug}/${j}` : null,
              priceCents: rbyte() % 3 ? Number(price) : null,
              note: rbyte() % 2 ? "idée sympa" : null,
            },
            select: { id: true },
          });
          items.push(item);
        }

        // reservations on half
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

        // ideas on 20%
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

      // invites
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

  console.log(`✅ Seeded ${count} events (${users.length} users).`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
