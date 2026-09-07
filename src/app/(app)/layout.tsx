import { ReactNode } from "react";
import { auth } from "@/auth";
import { AUTH_ENTRY_PATH } from "@/features/auth/routes";
import { redirect } from "next/navigation";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect(AUTH_ENTRY_PATH);
  return <>{children}</>;
}
