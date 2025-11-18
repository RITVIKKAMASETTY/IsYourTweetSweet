// // src/types/next-auth.d.ts
// import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

// declare module "next-auth" {
//   interface User extends DefaultUser {
//     twitterId?: string;
//     accessToken?: string;
//     refreshToken?: string;
//   }

//   interface Session extends DefaultSession {
//     user: {
//       /** Name, email, image are in DefaultSession.user */
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//       // our custom fields
//       twitterId?: string;
//       accessToken?: string;
//       refreshToken?: string;
//     } & DefaultSession["user"];
//   }
// }
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accessToken?: string;
      refreshToken?: string;
      twitterId?: string;
      accessTokenExpires?: number;
    };
    error?: string;
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    twitterId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    twitterId?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}