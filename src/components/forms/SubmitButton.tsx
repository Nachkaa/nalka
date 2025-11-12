"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Props = React.ComponentProps<typeof Button> & { children: React.ReactNode };

export default function SubmitButton({ children, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...rest}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
      {pending ? "Enregistrement…" : children}
    </Button>
  );
}
