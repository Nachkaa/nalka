import Link from "next/link";
import { Button } from "@/components/ui/button";

type SuggestIdeaButtonProps = {
  href: string;
  ownerName: string;
};

export function SuggestIdeaButton({ href, ownerName }: SuggestIdeaButtonProps) {
  const label = ownerName ? `Suggérer une idée à ${ownerName}` : "Suggérer une idée";

  return (
    <Button
      asChild
      variant="outline"
      className="w-full justify-center py-3 text-center text-sm leading-snug whitespace-normal"
    >
      <Link href={href}>{label}</Link>
    </Button>
  );
}
