import Link from "next/link";
import { Button } from "@/components/ui/button";


type SuggestIdeaButtonProps = {
  href: string;
  ownerName: string;
};

export function SuggestIdeaButton({ href, ownerName }: SuggestIdeaButtonProps) {
  const label = ownerName
    ? `Suggérer une idée à ${ownerName}`
    : "Suggérer une idée";

  return (
    <Button
      asChild
      variant="outline"
      className="w-full justify-center whitespace-normal text-center text-sm leading-snug py-3"
    >
      <Link href={href}>{label}</Link>
    </Button>
  );
}
