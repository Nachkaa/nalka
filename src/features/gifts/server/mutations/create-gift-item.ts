import { requireGiftActor, requireGiftsMemberAccess } from "../access";
import {
  applyGiftRateLimit,
  parseGiftFormInput,
  revalidateGiftPaths,
  resolveGiftImage,
  resolveTargetListForCurrentUser,
} from "./shared";

import { prisma } from "@/lib/prisma";

export async function createGiftItem(args: {
  eventId: string;
  slug: string;
  formData: FormData;
}) {
  const user = await requireGiftActor();
  await requireGiftsMemberAccess(args.eventId, user.id);
  await applyGiftRateLimit({ action: "create", userId: user.id, max: 30 });

  const input = parseGiftFormInput(args.formData);
  const imagePath = await resolveGiftImage(args.formData, null);
  const list = await resolveTargetListForCurrentUser(args.eventId, user.id);

  const gift = await prisma.giftItem.create({
    data: {
      listId: list.id,
      title: input.title,
      note: input.note,
      url: input.url,
      imagePath,
    },
    select: {
      id: true,
    },
  });

  revalidateGiftPaths(args.slug);

  return { id: gift.id };
}
