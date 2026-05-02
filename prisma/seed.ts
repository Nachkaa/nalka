import {
  BudgetLineCategory,
  BudgetLineSourcingStatus,
  EventGiftMode,
  EventModuleKey,
  PaymentEntryType,
  PrismaClient,
  QuoteStatus,
} from "@prisma/client";
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
const dateTimeUtc = (y: number, m: number, d: number, hh = 12, mm = 0) =>
  new Date(Date.UTC(y, m - 1, d, hh, mm, 0));

const MODULE_POSITIONS = {
  OVERVIEW: 0,
  GIFTS: 1,
  SECRET_SANTA: 2,
  POTLUCK: 3,
  TIMELINE: 4,
  BUDGET: 5,
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
    prisma.quoteAttachment.deleteMany(),
    prisma.paymentEntry.deleteMany(),
    prisma.quote.deleteMany(),
    prisma.budgetLine.deleteMany(),
    prisma.budget.deleteMany(),
    prisma.vendor.deleteMany(),
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
        { key: EventModuleKey.BUDGET, enabled: true },
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
        data: { eventModuleId: moduleByKey.get(EventModuleKey.BUDGET)!.id },
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

  console.log("Budget scenario");
  const organizer = users[0]!;
  const adminMember = users[1]!;
  const regularMember = users[2]!;

  const budgetEvent = await prisma.event.create({
    data: {
      ownerId: organizer.id,
      title: "Mariage Juliette & Maxime",
      description: "Scenario seed for the Nalka budget module.",
      eventOn: dateOnly(2026, 7, 18),
      location: "Provence",
      slug: "mariage-juliette-maxime-budget",
      linkEnabled: true,
      colorHex: "#0ea5e9",
      budgetMode: "FIXED",
      budgetCents: 15000000,
      giftMode: EventGiftMode.HOST_LIST,
      scheduleMode: "EXACT",
      locationMode: "EXACT",
      eventTime: "16:00",
      memberships: {
        create: [
          { userId: organizer.id, role: "OWNER" },
          { userId: adminMember.id, role: "ADMIN" },
          { userId: regularMember.id, role: "MEMBER" },
        ],
      },
      modules: {
        create: [
          { key: EventModuleKey.OVERVIEW, enabled: true, position: MODULE_POSITIONS.OVERVIEW },
          { key: EventModuleKey.GIFTS, enabled: false, position: MODULE_POSITIONS.GIFTS },
          { key: EventModuleKey.SECRET_SANTA, enabled: false, position: MODULE_POSITIONS.SECRET_SANTA },
          { key: EventModuleKey.POTLUCK, enabled: false, position: MODULE_POSITIONS.POTLUCK },
          { key: EventModuleKey.TIMELINE, enabled: true, position: MODULE_POSITIONS.TIMELINE },
          { key: EventModuleKey.BUDGET, enabled: true, position: MODULE_POSITIONS.BUDGET },
          { key: EventModuleKey.POLLS, enabled: false, position: MODULE_POSITIONS.POLLS },
          { key: EventModuleKey.CHAT, enabled: false, position: MODULE_POSITIONS.CHAT },
        ],
      },
    },
    select: { id: true },
  });

  const budgetModules = await prisma.eventModule.findMany({
    where: { eventId: budgetEvent.id },
    select: { id: true, key: true },
  });
  const budgetModuleByKey = new Map(budgetModules.map((module) => [module.key, module.id]));

  await prisma.$transaction([
    prisma.eventOverviewSettings.create({
      data: { eventModuleId: budgetModuleByKey.get(EventModuleKey.OVERVIEW)! },
    }),
    prisma.eventGiftsSettings.create({
      data: {
        eventModuleId: budgetModuleByKey.get(EventModuleKey.GIFTS)!,
        isNoSpoil: true,
        isAnonReservations: true,
        isSecondHandOk: false,
        isHandmadeOk: false,
      },
    }),
    prisma.eventSecretSantaSettings.create({
      data: { eventModuleId: budgetModuleByKey.get(EventModuleKey.SECRET_SANTA)! },
    }),
    prisma.eventPotluckSettings.create({
      data: { eventModuleId: budgetModuleByKey.get(EventModuleKey.POTLUCK)! },
    }),
    prisma.eventTimelineSettings.create({
      data: { eventModuleId: budgetModuleByKey.get(EventModuleKey.TIMELINE)! },
    }),
    prisma.eventExpensesSettings.create({
      data: { eventModuleId: budgetModuleByKey.get(EventModuleKey.BUDGET)! },
    }),
    prisma.eventPollsSettings.create({
      data: { eventModuleId: budgetModuleByKey.get(EventModuleKey.POLLS)! },
    }),
    prisma.eventChatSettings.create({
      data: { eventModuleId: budgetModuleByKey.get(EventModuleKey.CHAT)! },
    }),
  ]);

  const budget = await prisma.budget.create({
    data: {
      eventId: budgetEvent.id,
      totalBudget: "150000.00",
    },
  });

  const vendors = await prisma.$transaction([
    prisma.vendor.create({
      data: {
        eventId: budgetEvent.id,
        name: "Chateau des Rives",
        vendorType: "Venue",
        contactName: "Claire Dubois",
        email: "claire@chateaudesrives.example",
        phone: "+33 4 90 00 10 10",
      },
    }),
    prisma.vendor.create({
      data: {
        eventId: budgetEvent.id,
        name: "Domaine des Oliviers",
        vendorType: "Venue",
        contactName: "Marc Reynaud",
        email: "sales@domainedesoliviers.example",
        phone: "+33 4 90 12 34 56",
      },
    }),
    prisma.vendor.create({
      data: {
        eventId: budgetEvent.id,
        name: "Maison Bellanger Traiteur",
        vendorType: "Catering",
        contactName: "Thomas Bellanger",
        email: "contact@bellanger-traiteur.example",
        phone: "+33 1 44 10 52 00",
      },
    }),
    prisma.vendor.create({
      data: {
        eventId: budgetEvent.id,
        name: "The Midnight Parade",
        vendorType: "Live band",
        contactName: "Sarah Klein",
        email: "booking@midnightparade.example",
        phone: "+33 6 10 20 30 40",
      },
    }),
    prisma.vendor.create({
      data: {
        eventId: budgetEvent.id,
        name: "Studio Lumiere",
        vendorType: "Photo & video",
        contactName: "Nora Martin",
        email: "hello@studio-lumiere.example",
        phone: "+33 6 22 44 66 88",
      },
    }),
    prisma.vendor.create({
      data: {
        eventId: budgetEvent.id,
        name: "Atelier Camera",
        vendorType: "Photo & video",
        contactName: "Leo Bernard",
        email: "quotes@atelier-camera.example",
        phone: "+33 6 98 11 22 33",
      },
    }),
    prisma.vendor.create({
      data: {
        eventId: budgetEvent.id,
        name: "Azur Chauffeurs",
        vendorType: "Transportation",
        contactName: "Sofia Rossi",
        email: "events@azur-chauffeurs.example",
        phone: "+33 4 91 77 55 00",
      },
    }),
    prisma.vendor.create({
      data: {
        eventId: budgetEvent.id,
        name: "Maison Dahlia",
        vendorType: "Floral design",
        contactName: "Eva Morel",
        email: "bonjour@maisondahlia.example",
        phone: "+33 4 93 20 20 20",
      },
    }),
  ]);

  const vendorByName = new Map(vendors.map((vendor) => [vendor.name, vendor]));

  const lines = await prisma.$transaction([
    prisma.budgetLine.create({
      data: {
        budgetId: budget.id,
        category: BudgetLineCategory.VENUE,
        label: "Main event space",
        targetAmount: "40000.00",
        estimatedAmount: "39500.00",
        sourcingStatus: BudgetLineSourcingStatus.BOOKED,
        internalNote: "Preferred option because it includes ceremony garden access.",
      },
    }),
    prisma.budgetLine.create({
      data: {
        budgetId: budget.id,
        category: BudgetLineCategory.FOOD_BEVERAGE,
        label: "Catering service",
        targetAmount: "52000.00",
        estimatedAmount: "54800.00",
        sourcingStatus: BudgetLineSourcingStatus.BOOKED,
        internalNote: "Premium late-night service pushes this line above target.",
      },
    }),
    prisma.budgetLine.create({
      data: {
        budgetId: budget.id,
        category: BudgetLineCategory.ENTERTAINMENT,
        label: "Live band",
        targetAmount: "9000.00",
        estimatedAmount: "8800.00",
        sourcingStatus: BudgetLineSourcingStatus.BOOKED,
      },
    }),
    prisma.budgetLine.create({
      data: {
        budgetId: budget.id,
        category: BudgetLineCategory.GUEST_EXPERIENCE,
        label: "Photography & videography",
        targetAmount: "12000.00",
        estimatedAmount: "11800.00",
        sourcingStatus: BudgetLineSourcingStatus.QUOTES_RECEIVED,
        internalNote: "Need to decide between documentary style and cinematic edit.",
      },
    }),
    prisma.budgetLine.create({
      data: {
        budgetId: budget.id,
        category: BudgetLineCategory.LOGISTICS,
        label: "Transportation service",
        targetAmount: "7000.00",
        sourcingStatus: BudgetLineSourcingStatus.SOURCING,
        internalNote: "Guest shuttle routes still being confirmed.",
      },
    }),
    prisma.budgetLine.create({
      data: {
        budgetId: budget.id,
        category: BudgetLineCategory.DESIGN_DECORATION,
        label: "Floral arrangements",
        targetAmount: "8500.00",
        estimatedAmount: "9200.00",
        sourcingStatus: BudgetLineSourcingStatus.SELECTED,
        internalNote: "Proposal selected pending final stem count confirmation.",
      },
    }),
  ]);

  const lineByLabel = new Map(lines.map((line) => [line.label, line]));

  const quotes = await prisma.$transaction([
    prisma.quote.create({
      data: {
        budgetLineId: lineByLabel.get("Main event space")!.id,
        vendorId: vendorByName.get("Chateau des Rives")!.id,
        status: QuoteStatus.SELECTED,
        amount: "39500.00",
        scope: "Exclusive venue hire from Friday noon to Sunday 10am with ceremony garden access.",
        requestedAt: dateTimeUtc(2026, 1, 12, 10, 0),
        receivedAt: dateTimeUtc(2026, 1, 18, 15, 30),
        validUntil: dateTimeUtc(2026, 2, 15, 18, 0),
        decisionNote: "Selected after site visit and contract review.",
      },
    }),
    prisma.quote.create({
      data: {
        budgetLineId: lineByLabel.get("Main event space")!.id,
        vendorId: vendorByName.get("Domaine des Oliviers")!.id,
        status: QuoteStatus.REJECTED,
        amount: "42800.00",
        scope: "Alternate private estate rental without accommodation.",
        requestedAt: dateTimeUtc(2026, 1, 10, 9, 0),
        receivedAt: dateTimeUtc(2026, 1, 19, 11, 0),
        validUntil: dateTimeUtc(2026, 2, 10, 18, 0),
        decisionNote: "Rejected because accommodation and logistics were weaker.",
      },
    }),
    prisma.quote.create({
      data: {
        budgetLineId: lineByLabel.get("Catering service")!.id,
        vendorId: vendorByName.get("Maison Bellanger Traiteur")!.id,
        status: QuoteStatus.SELECTED,
        amount: "54800.00",
        scope: "Cocktail hour, seated dinner for 160 guests, dessert buffet, and late-night snacks.",
        requestedAt: dateTimeUtc(2026, 1, 20, 14, 0),
        receivedAt: dateTimeUtc(2026, 1, 27, 16, 45),
        validUntil: dateTimeUtc(2026, 2, 28, 18, 0),
        decisionNote: "Selected for menu quality and staffing plan.",
      },
    }),
    prisma.quote.create({
      data: {
        budgetLineId: lineByLabel.get("Live band")!.id,
        vendorId: vendorByName.get("The Midnight Parade")!.id,
        status: QuoteStatus.SELECTED,
        amount: "8800.00",
        scope: "Six-piece band, cocktail trio set, main party set, and sound engineer.",
        requestedAt: dateTimeUtc(2026, 2, 3, 10, 0),
        receivedAt: dateTimeUtc(2026, 2, 6, 13, 15),
        validUntil: dateTimeUtc(2026, 3, 1, 18, 0),
      },
    }),
    prisma.quote.create({
      data: {
        budgetLineId: lineByLabel.get("Photography & videography")!.id,
        vendorId: vendorByName.get("Studio Lumiere")!.id,
        status: QuoteStatus.RECEIVED,
        amount: "11800.00",
        scope: "Two photographers, one videographer, 12-hour coverage, highlight film, and gallery delivery.",
        requestedAt: dateTimeUtc(2026, 2, 14, 9, 30),
        receivedAt: dateTimeUtc(2026, 2, 18, 17, 10),
        validUntil: dateTimeUtc(2026, 3, 18, 18, 0),
        internalNote: "Strong editorial style, slightly higher post-production timeline.",
      },
    }),
    prisma.quote.create({
      data: {
        budgetLineId: lineByLabel.get("Photography & videography")!.id,
        vendorId: vendorByName.get("Atelier Camera")!.id,
        status: QuoteStatus.RECEIVED,
        amount: "10900.00",
        scope: "One photographer, one videographer, 10-hour coverage, teaser reel, and online gallery.",
        requestedAt: dateTimeUtc(2026, 2, 14, 10, 0),
        receivedAt: dateTimeUtc(2026, 2, 20, 14, 20),
        validUntil: dateTimeUtc(2026, 3, 25, 18, 0),
        internalNote: "Still under consideration pending portfolio review.",
      },
    }),
    prisma.quote.create({
      data: {
        budgetLineId: lineByLabel.get("Transportation service")!.id,
        vendorId: vendorByName.get("Azur Chauffeurs")!.id,
        status: QuoteStatus.AWAITING_RESPONSE,
        requestedAt: dateTimeUtc(2026, 3, 1, 11, 0),
        internalNote: "Vendor contacted for shuttle loops between hotel blocks and venue.",
      },
    }),
    prisma.quote.create({
      data: {
        budgetLineId: lineByLabel.get("Floral arrangements")!.id,
        vendorId: vendorByName.get("Maison Dahlia")!.id,
        status: QuoteStatus.SELECTED,
        amount: "9200.00",
        scope: "Ceremony arch, reception centerpieces, bridal party bouquets, and table greenery.",
        requestedAt: dateTimeUtc(2026, 2, 10, 10, 30),
        receivedAt: dateTimeUtc(2026, 2, 16, 12, 0),
        validUntil: dateTimeUtc(2026, 3, 10, 18, 0),
        decisionNote: "Creative direction approved, awaiting final stem count.",
      },
    }),
  ]);

  const venueSelectedQuote = quotes.find(
    (quote) =>
      quote.budgetLineId === lineByLabel.get("Main event space")!.id && quote.status === QuoteStatus.SELECTED,
  )!;
  const cateringSelectedQuote = quotes.find(
    (quote) =>
      quote.budgetLineId === lineByLabel.get("Catering service")!.id && quote.status === QuoteStatus.SELECTED,
  )!;
  const bandSelectedQuote = quotes.find(
    (quote) => quote.budgetLineId === lineByLabel.get("Live band")!.id && quote.status === QuoteStatus.SELECTED,
  )!;
  const floralSelectedQuote = quotes.find(
    (quote) =>
      quote.budgetLineId === lineByLabel.get("Floral arrangements")!.id && quote.status === QuoteStatus.SELECTED,
  )!;

  await prisma.$transaction([
    prisma.budgetLine.update({
      where: { id: lineByLabel.get("Main event space")!.id },
      data: { selectedQuoteId: venueSelectedQuote.id },
    }),
    prisma.budgetLine.update({
      where: { id: lineByLabel.get("Catering service")!.id },
      data: { selectedQuoteId: cateringSelectedQuote.id },
    }),
    prisma.budgetLine.update({
      where: { id: lineByLabel.get("Live band")!.id },
      data: { selectedQuoteId: bandSelectedQuote.id },
    }),
    prisma.budgetLine.update({
      where: { id: lineByLabel.get("Floral arrangements")!.id },
      data: { selectedQuoteId: floralSelectedQuote.id },
    }),
  ]);

  await prisma.quoteAttachment.createMany({
    data: [
      {
        quoteId: venueSelectedQuote.id,
        fileName: "chateau-des-rives-proposal.pdf",
        fileUrl: "https://files.example.com/budget/chateau-des-rives-proposal.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 2_481_120,
      },
      {
        quoteId: cateringSelectedQuote.id,
        fileName: "bellanger-sample-menu.pdf",
        fileUrl: "https://files.example.com/budget/bellanger-sample-menu.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1_124_005,
      },
      {
        quoteId: floralSelectedQuote.id,
        fileName: "maison-dahlia-moodboard.jpg",
        fileUrl: "https://files.example.com/budget/maison-dahlia-moodboard.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: 845_221,
      },
      {
        quoteId: quotes.find(
          (quote) =>
            quote.budgetLineId === lineByLabel.get("Photography & videography")!.id &&
            quote.status === QuoteStatus.RECEIVED,
        )!.id,
        fileName: "studio-lumiere-packages.pdf",
        fileUrl: "https://files.example.com/budget/studio-lumiere-packages.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1_936_442,
      },
    ],
  });

  await prisma.paymentEntry.createMany({
    data: [
      {
        budgetLineId: lineByLabel.get("Catering service")!.id,
        quoteId: cateringSelectedQuote.id,
        label: "Catering deposit",
        entryType: PaymentEntryType.DEPOSIT,
        amount: "15000.00",
        dueDate: dateTimeUtc(2026, 3, 15),
        paidAt: dateTimeUtc(2026, 3, 14, 9, 15),
        note: "Deposit wired after contract signature.",
      },
      {
        budgetLineId: lineByLabel.get("Catering service")!.id,
        quoteId: cateringSelectedQuote.id,
        label: "Catering final balance",
        entryType: PaymentEntryType.BALANCE,
        amount: "39800.00",
        dueDate: dateTimeUtc(2026, 7, 10),
        note: "Due one week before the event.",
      },
      {
        budgetLineId: lineByLabel.get("Live band")!.id,
        quoteId: bandSelectedQuote.id,
        label: "Band deposit",
        entryType: PaymentEntryType.DEPOSIT,
        amount: "4400.00",
        dueDate: dateTimeUtc(2026, 3, 5),
        paidAt: dateTimeUtc(2026, 3, 5, 11, 45),
      },
      {
        budgetLineId: lineByLabel.get("Live band")!.id,
        quoteId: bandSelectedQuote.id,
        label: "Band final balance",
        entryType: PaymentEntryType.BALANCE,
        amount: "4400.00",
        dueDate: dateTimeUtc(2026, 7, 1),
        paidAt: dateTimeUtc(2026, 7, 1, 8, 30),
        note: "Fully paid ahead of final rehearsal confirmation.",
      },
    ],
  });

  count++;

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
