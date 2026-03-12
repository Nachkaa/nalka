import type { NextAuthOptions } from "next-auth";

export const authConfig: NextAuthOptions = {
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  providers: [],
};
