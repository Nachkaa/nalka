import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  providers: [],
};