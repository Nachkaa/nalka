import { ArrowRight, TreePine } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ChristmasWelcomeCard() {
  return (
    <section
      aria-labelledby="christmas-welcome-title"
      className="dark:bg-card mb-8 grid overflow-hidden rounded-3xl border bg-[#fcf8f3] md:grid-cols-[1fr_240px]"
    >
      <div className="space-y-3 p-6 sm:p-8">
        <p className="text-primary flex items-center gap-2 text-sm font-semibold">
          <TreePine className="size-4" aria-hidden />
          Noël en famille ou entre amis
        </p>
        <h2
          id="christmas-welcome-title"
          className="text-foreground text-2xl font-semibold tracking-tight"
        >
          Et si on préparait Noël ensemble ?
        </h2>
        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
          Les idées de cadeaux, un Secret Santa, le repas à partager : créez votre événement et
          invitez vos proches à participer aux préparatifs.
        </p>
        <Button asChild className="mt-1 rounded-xl">
          <Link href="/event/new?occasion=christmas">
            Préparer mon Noël
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
      <div className="relative hidden md:block" aria-hidden>
        <Image
          src="/images/usecases/christmas.webp"
          alt=""
          fill
          sizes="240px"
          className="object-cover"
        />
      </div>
    </section>
  );
}
