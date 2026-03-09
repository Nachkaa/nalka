import { cn } from "@/lib/utils";
import { Ban, Check, HelpCircle } from "lucide-react";

export type StatusBadgeStatus = "PENDING" | "GOING" | "MAYBE" | "NOT_GOING";

type Props = {
  status: StatusBadgeStatus;
  className?: string;
};

const CONFIG: Record<
  StatusBadgeStatus,
  { label: string; Icon: typeof Check; iconClassName: string }
> = {
  GOING: { label: "Je viens", Icon: Check, iconClassName: "text-emerald-600" },
  MAYBE: { label: "Peut-être", Icon: HelpCircle, iconClassName: "text-muted-foreground" },
  NOT_GOING: { label: "Je ne viens pas", Icon: Ban, iconClassName: "text-rose-600" },
  PENDING: { label: "En attente", Icon: HelpCircle, iconClassName: "text-muted-foreground" },
};

export function StatusBadge({ status, className }: Props) {
  const { label, Icon, iconClassName } = CONFIG[status];

  return (
    <span
      className={cn(
        "bg-muted/30 text-foreground inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] leading-none font-medium",
        "border-border/50 border",
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", iconClassName)} aria-hidden="true" />
      <span className="leading-none">{label}</span>
    </span>
  );
}
