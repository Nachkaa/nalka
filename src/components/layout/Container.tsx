import { cn } from "@/lib/utils";

type Props = React.PropsWithChildren<{ className?: string }>;

export default function Container({ children, className }: Props) {
  return (
    <div className={cn("mx-auto max-w-6xl px-6 md:px-10", className)}>
      {children}
    </div>
  );
}
