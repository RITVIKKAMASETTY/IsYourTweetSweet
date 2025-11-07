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

/**
 * Refresh an OAuth2 access token using the refresh token.
 * Adjust endpoint/params if Twitter changes their OAuth2 refresh implementation.
 */
async function refreshAccessToken(token: any) {
  try {
    const url = "https://api.twitter.com/2/oauth2/token";
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", token.refreshToken);
    params.append("client_id", process.env.TWITTER_CLIENT_ID!);

    // If your app requires client_secret in Basic auth, uncomment the Authorization header below:
    // const basicAuth = Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // "Authorization": `Basic ${basicAuth}`, // uncomment if required by Twitter
      },
      body: params.toString(),
    });

    const refreshed = await res.json();

    if (!res.ok) {
      console.error("Failed to refresh token", res.status, refreshed);
      throw refreshed;
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken, // fallback to old refresh token
    };
  } catch (error) {
    console.error("refreshAccessToken error:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        params: {
          // IMPORTANT: include tweet.write and offline.access for posting + refresh
          scope: "tweet.read tweet.write users.read offline.access",
          // prompt: "consent" // optionally force re-consent
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
    error: "/", // redirect to home on error
  },

  callbacks: {
    /**
     * jwt callback runs when user signs in and whenever a JWT is checked.
     * We persist access/refresh tokens and expiry inside the token.
     */
    async jwt({ token, account, profile }) {
      // initial sign in: account will be defined
      if (account) {
        // account.access_token / account.refresh_token come from provider
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // converts expires_at (seconds) -> millis, or use account.expires_in
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : account.expires_in
          ? Date.now() + account.expires_in * 1000
          : null;

        // capture twitter id from profile (v2 shape may be profile.data.id)
        if (profile?.data?.id) {
          token.twitterId = profile.data.id;
        } else if (profile?.id) {
          token.twitterId = profile.id;
        }
        return token;
      }

      // Return early if token still valid
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token expired -> try to refresh using refresh token
      if (token.refreshToken) {
        const refreshed = await refreshAccessToken(token);
        return refreshed;
      }

      // Nothing we can do, return current token (user must re-login)
      return token;
    },

    /**
     * session callback makes token fields available on session.user
     * so server routes can access session.user.accessToken, etc.
     */
    async session({ session, token }) {
      session.user = session.user || ({} as any);
      session.user.accessToken = token.accessToken;
      session.user.refreshToken = token.refreshToken;
      session.user.accessTokenExpires = token.accessTokenExpires;
      session.user.twitterId = token.twitterId;
      return session;
    },
  },

  debug: true,
};

export default authOptions;
