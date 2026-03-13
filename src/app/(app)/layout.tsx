import { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <>{children}</>;
}
