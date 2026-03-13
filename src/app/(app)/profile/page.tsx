import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { ProfilePageClient } from "./ProfilePageClient";

type ProfilePageProps = {
  searchParams: Promise<{
    linked?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const [{ linked }, user] = await Promise.all([
    searchParams,
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    }),
  ]);

  const isGoogleLinked = user?.accounts.some((account) => account.provider === "google") ?? false;

  return (
    <ProfilePageClient
      isGoogleLinked={isGoogleLinked}
      googleLinkedJustNow={linked === "google"}
    />
  );
}
