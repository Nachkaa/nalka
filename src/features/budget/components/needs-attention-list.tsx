import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NeedsAttentionItem } from "@/features/budget/lib/types";
import Link from "next/link";

export function NeedsAttentionList(props: { items: NeedsAttentionItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>A surveiller</CardTitle>
      </CardHeader>
      <CardContent>
        {props.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Rien d&apos;urgent pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {props.items.map((item) => (
              <li key={item.id} className="border-border rounded-lg border p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">{item.detail}</p>
                <Link href={item.href} className="text-primary mt-2 inline-flex text-sm font-medium">
                  Ouvrir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
