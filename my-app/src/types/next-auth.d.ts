// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    twitterId?: string;
    accessToken?: string;
    refreshToken?: string;
  }

  interface Session extends DefaultSession {
    user: {
      /** Name, email, image are in DefaultSession.user */
      name?: string | null;
      email?: string | null;
      image?: string | null;
      // our custom fields
      twitterId?: string;
      accessToken?: string;
      refreshToken?: string;
    } & DefaultSession["user"];
  }
}
