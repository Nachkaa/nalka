"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type SuggestIdeaButtonProps = {
  href: string;
  ownerName: string;
};

export function SuggestIdeaButton({ href, ownerName }: SuggestIdeaButtonProps) {
  return (
    <Button asChild variant="outline" className="w-full justify-center">
      <Link href={href}>
        Suggérer une idée à {ownerName}
      </Link>
    </Button>
  );
}
