import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, ExternalLink, Heart, Image as ImageIcon, Lock } from "lucide-react";
import Image from "next/image";

import { GiftItemActions } from "./GiftItemActions";
import { RemoteGiftImage } from "./RemoteGiftImage";

type GiftItem = {
  id: string;
  title: string;
  url: string | null;
  note: string | null;
  imagePath: string | null;
  isReserved: boolean;
  isReservedByMe: boolean;
  reservedByName: string | null;
  reservedByNames?: string[];
  isSuggestion?: boolean;
  hideReservationState?: boolean;
};

type Props = {
  item: GiftItem;
  slug: string;
  eventId: string;
  isMyList: boolean;
  isAnonReservations: boolean;
  canReserve: boolean;
  canUnreserve: boolean;
  onReserve?: () => Promise<void>;
  onUnreserve?: () => Promise<void>;
  deleteGift?: (formData: FormData) => Promise<void>;
};

function getUrlHost(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isRemoteImageUrl(value: string | null | undefined) {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalImagePath(value: string | null | undefined) {
  return typeof value === "string" && value.startsWith("/");
}

export function GiftItemCard({
  item,
  slug,
  eventId,
  isMyList,
  isAnonReservations,
  canReserve,
  canUnreserve,
  onReserve,
  onUnreserve,
  deleteGift,
}: Props) {
  const host = item.url ? getUrlHost(item.url) : null;
  const hasLocalImage = isLocalImagePath(item.imagePath);
  const hasRemoteImage = isRemoteImageUrl(item.imagePath);
  const hasImage = hasLocalImage || hasRemoteImage;
  const showReservation = item.isReserved && !item.hideReservationState;

  return (
    <Card
      className={cn(
        "!p-0",
        "group bg-card relative flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md",
        item.isReservedByMe && "ring-primary ring-2",
      )}
    >
      <CardContent className="flex h-full flex-col p-0">
        <div
          className={cn(
            "relative aspect-[16/10] w-full overflow-hidden",
            hasImage ? "bg-white" : "bg-gradient-to-br from-primary/15 to-primary/5",
          )}
        >
          {hasImage ? (
            <>
              <div className="grid h-full w-full place-items-center">
                <ImageIcon className="text-primary/50 h-7 w-7" />
              </div>

              {hasLocalImage ? (
                <Image
                  src={item.imagePath!}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              ) : hasRemoteImage ? (
                <RemoteGiftImage
                  src={item.imagePath!}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              ) : null}
            </>
          ) : (
            <div className="grid h-full w-full place-items-center">
              <ImageIcon className="text-primary/50 h-7 w-7" />
            </div>
          )}

          {showReservation && (isMyList || item.isReservedByMe) ? (
            <div className="absolute top-2 left-2">
              <Badge
                variant={item.isReservedByMe ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {item.isReservedByMe ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Réservé par toi</span>
                  </>
                ) : item.reservedByName ? (
                  <span>Réservé par {item.reservedByName}</span>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>Réservé</span>
                  </>
                )}
              </Badge>
            </div>
          ) : null}

          {isMyList && deleteGift ? (
            <div className="absolute top-2 right-2">
              <GiftItemActions
                slug={slug}
                eventId={eventId}
                itemId={item.id}
                title={item.title}
                hasActive={showReservation}
                isNoSpoil={!!item.hideReservationState}
                defaultValues={{
                  title: item.title,
                  url: item.url,
                  note: item.note,
                  imagePath: item.imagePath,
                }}
                deleteGift={deleteGift}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-3">
          <div className="min-h-0">
            <h3 className="line-clamp-2 text-sm leading-snug font-semibold">{item.title}</h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {item.isSuggestion ? (
                <Badge variant="secondary" className="text-[10px] font-semibold uppercase">
                  Proposé
                </Badge>
              ) : null}

              {host && item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                  title={item.url}
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">{host}</span>
                </a>
              ) : null}
            </div>

            {item.note ? (
              <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{item.note}</p>
            ) : null}

            {showReservation &&
            !isAnonReservations &&
            !item.isReservedByMe &&
            item.reservedByName ? (
              <p className="text-muted-foreground mt-3 text-xs">
                Réservé par {item.reservedByName}
              </p>
            ) : null}

            {isMyList && showReservation && item.reservedByNames?.length ? (
              <p className="text-muted-foreground mt-3 text-xs">
                Réservé par {item.reservedByNames.slice(0, 3).join(", ")}
                {item.reservedByNames.length > 3 ? ` (+${item.reservedByNames.length - 3})` : ""}
              </p>
            ) : null}
          </div>

          {!isMyList ? (
            <div className="mt-auto pt-3">
              <div className="grid gap-2">
                {canReserve && onReserve ? (
                  <form action={onReserve}>
                    <Button type="submit" variant="default" className="w-full" size="sm">
                      <Heart className="mr-2 h-4 w-4" />
                      Réserver
                    </Button>
                  </form>
                ) : null}

                {canUnreserve && onUnreserve ? (
                  <form action={onUnreserve}>
                    <Button type="submit" variant="outline" className="w-full" size="sm">
                      Annuler ma réservation
                    </Button>
                  </form>
                ) : null}

                {showReservation && !item.isReservedByMe ? (
                  <div className="bg-muted/40 text-muted-foreground rounded-md border px-3 py-2 text-center text-sm">
                    {isAnonReservations ? (
                      <span className="inline-flex items-center gap-2">
                        <Lock className="h-4 w-4" /> Déjà réservé
                      </span>
                    ) : item.reservedByName ? (
                      `Réservé par ${item.reservedByName}`
                    ) : (
                      "Déjà réservé"
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
