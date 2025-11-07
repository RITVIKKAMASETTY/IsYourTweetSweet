// // src/lib/auth.ts
// import TwitterProvider from "next-auth/providers/twitter";
// import { NextAuthOptions } from "next-auth";

// export const authOptions: NextAuthOptions = {
//   providers: [
//     TwitterProvider({
//       clientId: process.env.TWITTER_CLIENT_ID!,
//       clientSecret: process.env.TWITTER_CLIENT_SECRET!,
//       version: "2.0",
//       authorization: {
//         params: {
//           scope: "tweet.read users.read offline.access",
//         },
//       },
//     }),
//   ],
//   secret: process.env.NEXTAUTH_SECRET,
//   pages: {
//     signIn: '/',
//     error: '/', // Redirect to home on error
//   },
//   callbacks: {
//     async jwt({ token, account, profile }) {
//       if (account) {
//         token.accessToken = account.access_token;
//         token.refreshToken = account.refresh_token;
//         token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : null;
        
//         // Capture Twitter ID from profile
//         if (profile?.data?.id) {
//           token.twitterId = profile.data.id;
//         } else if (profile?.id) {
//           token.twitterId = profile.id;
//         }
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       session.user.accessToken = token.accessToken;
//       session.user.refreshToken = token.refreshToken;
//       session.user.twitterId = token.twitterId;
//       return session;
//     },
//   },
//   debug: true, // Enable debug mode to see detailed errors
// };
// src/lib/auth.ts
import TwitterProvider from "next-auth/providers/twitter";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";

/**
 * --------------------------------------------------------------------
 * 1. Refresh an OAuth-2 access token (Twitter v2)
 * --------------------------------------------------------------------
 * Twitter’s OAuth-2 refresh endpoint is **not** documented publicly,
 * but it works exactly like the spec: POST to /oauth2/token with
 * grant_type=refresh_token.
 *
 * The request must be sent as `application/x-www-form-urlencoded`
 * and **client_id** is required. If your app is “confidential”
 * (has a client secret) you can also send Basic auth – the code
 * below works with both.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = "https://api.twitter.com/2/oauth2/token";

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken as string,
      client_id: process.env.TWITTER_CLIENT_ID!,
    });

    // OPTIONAL: if your app is confidential, uncomment the line below
    // const basic = Buffer.from(
    //   `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    // ).toString("base64");
    // headers["Authorization"] = `Basic ${basic}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // "Authorization": `Basic ${basic}`, // <-- uncomment if needed
      },
      body,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[auth] Token refresh failed", res.status, data);
      throw data;
    }

    console.log("[auth] Token refreshed – new expiry in", data.expires_in, "s");

    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + (data.expires_in ?? 7200) * 1000,
      refreshToken: data.refresh_token ?? token.refreshToken, // fallback
    };
  } catch (err) {
    console.error("[auth] refreshAccessToken error:", err);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

/**
 * --------------------------------------------------------------------
 * 2. Next-Auth configuration
 * --------------------------------------------------------------------
 */
export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0", // forces OAuth-2 (mandatory for tweet.write)
      authorization: {
        params: {
          /**
           * Scopes you **must** request:
           *   tweet.read  – GET /users/:id/tweets
           *   tweet.write – POST /tweets
           *   users.read  – GET /users/me (to read the user ID)
           *   offline.access – gives a refresh token
           */
          scope: "tweet.read tweet.write users.read offline.access",
          // Uncomment the line below if you want to force the consent screen
          // every time (useful while testing):
          // prompt: "consent",
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
    error: "/",
  },

  callbacks: {
    /** ---------------------------------------------------------
     *  jwt() – runs on sign-in **and** on every session check
     * --------------------------------------------------------- */
    async jwt({ token, account, profile }) {
      // -----------------------------------------------------------------
      // 1. First sign-in (account is present)
      // -----------------------------------------------------------------
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : account.expires_in
          ? Date.now() + account.expires_in * 1000
          : null;

        // Twitter v2 returns profile.data.id
        token.twitterId =
          (profile as any)?.data?.id ?? (profile as any)?.id ?? account.providerAccountId;

        console.log("[auth] New session – scopes:", account.scope);
        return token;
      }

      // -----------------------------------------------------------------
      // 2. Token still valid → just return it
      // -----------------------------------------------------------------
      if (
        token.accessTokenExpires &&
        Date.now() < (token.accessTokenExpires as number)
      ) {
        return token;
      }

      // -----------------------------------------------------------------
      // 3. Token expired → try to refresh
      // -----------------------------------------------------------------
      if (token.refreshToken) {
        console.log("[auth] Access token expired – refreshing...");
        return await refreshAccessToken(token);
      }

      // -----------------------------------------------------------------
      // 4. Nothing we can do → user must re-authenticate
      // -----------------------------------------------------------------
      console.warn("[auth] No refresh token – forcing re-login");
      return token;
    },

    /** ---------------------------------------------------------
     *  session() – expose fields to server-side `getServerSession`
     * --------------------------------------------------------- */
    async session({ session, token }) {
      // @ts-ignore – NextAuth typings are a bit loose
      session.user = session.user ?? {};

      session.user.accessToken = token.accessToken as string | undefined;
      session.user.refreshToken = token.refreshToken as string | undefined;
      session.user.twitterId = token.twitterId as string | undefined;
      session.user.accessTokenExpires = token.accessTokenExpires as number | undefined;

      // Optional: surface refresh errors to the client
      if (token.error) session.error = token.error as string;

      return session;
    },
  },

  // -----------------------------------------------------------------
  // Debug mode prints everything NextAuth does – super handy locally
  // -----------------------------------------------------------------
  debug: process.env.NODE_ENV === "development",
};

export default authOptions;