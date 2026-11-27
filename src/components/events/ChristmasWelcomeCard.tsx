import { ArrowRight, TreePine } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ChristmasWelcomeCard() {
  return (
    <section
      aria-labelledby="christmas-welcome-title"
      className="bg-card mb-8 grid overflow-hidden rounded-2xl border md:grid-cols-[1fr_280px]"
    >
      <div className="space-y-3 p-6 sm:p-8">
        <p className="text-primary flex items-center gap-2 text-sm font-semibold">
          <TreePine className="size-4" aria-hidden />
          Entre amis, entre collègues, en famille
        </p>
        <h2
          id="christmas-welcome-title"
          className="text-foreground font-serif text-2xl leading-tight"
        >
          Un Secret Santa avec votre groupe ?
        </h2>
        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
          Un tirage privé, les idées de cadeaux de chacun et un moment à partager. Invitez votre
          groupe et préparez les fêtes à plusieurs.
        </p>
        <Button asChild className="mt-1 rounded-full">
          <Link href="/event/new?occasion=christmas">
            Organiser un Secret Santa
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
      <div className="relative hidden md:block" aria-hidden>
        <Image
          src="/images/christmas-gift-exchange.webp"
          alt=""
          fill
          sizes="280px"
          className="object-cover"
        />
      </div>
    </section>
  );
}
