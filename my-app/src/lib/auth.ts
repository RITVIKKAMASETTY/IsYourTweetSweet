// // import TwitterProvider from "next-auth/providers/twitter";
// // import { NextAuthOptions } from "next-auth";
// // import { JWT } from "next-auth/jwt";

// // async function refreshAccessToken(token: JWT): Promise<JWT> {
// //   try {
// //     const url = "https://api.twitter.com/2/oauth2/token";

// //     const body = new URLSearchParams({
// //       grant_type: "refresh_token",
// //       refresh_token: token.refreshToken as string,
// //       client_id: process.env.TWITTER_CLIENT_ID!,
// //     });

// //     // OPTIONAL: if your app is confidential, uncomment the line below
// //     // const basic = Buffer.from(
// //     //   `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
// //     // ).toString("base64");
// //     // headers["Authorization"] = `Basic ${basic}`;

// //     const res = await fetch(url, {
// //       method: "POST",
// //       headers: {
// //         "Content-Type": "application/x-www-form-urlencoded",
// //         // "Authorization": `Basic ${basic}`, // <-- uncomment if needed
// //       },
// //       body,
// //     });

// //     const data = await res.json();

// //     if (!res.ok) {
// //       console.error("[auth] Token refresh failed", res.status, data);
// //       throw data;
// //     }

// //     console.log("[auth] Token refreshed – new expiry in", data.expires_in, "s");

// //     return {
// //       ...token,
// //       accessToken: data.access_token,
// //       accessTokenExpires: Date.now() + (data.expires_in ?? 7200) * 1000,
// //       refreshToken: data.refresh_token ?? token.refreshToken, // fallback
// //     };
// //   } catch (err) {
// //     console.error("[auth] refreshAccessToken error:", err);
// //     return {
// //       ...token,
// //       error: "RefreshAccessTokenError",
// //     };
// //   }
// // }

// // /**
// //  * --------------------------------------------------------------------
// //  * 2. Next-Auth configuration
// //  * --------------------------------------------------------------------
// //  */
// // export const authOptions: NextAuthOptions = {
// //   providers: [
// //     TwitterProvider({
// //       clientId: process.env.TWITTER_CLIENT_ID!,
// //       clientSecret: process.env.TWITTER_CLIENT_SECRET!,
// //       version: "2.0", // forces OAuth-2 (mandatory for tweet.write)
// //       authorization: {
// //         params: {
// //           /**
// //            * Scopes you **must** request:
// //            *   tweet.read  – GET /users/:id/tweets
// //            *   tweet.write – POST /tweets
// //            *   users.read  – GET /users/me (to read the user ID)
// //            *   offline.access – gives a refresh token
// //            */
// //           scope: "tweet.read tweet.write users.read offline.access",
// //           // Uncomment the line below if you want to force the consent screen
// //           // every time (useful while testing):
// //           // prompt: "consent",
// //         },
// //       },
// //     }),
// //   ],

// //   secret: process.env.NEXTAUTH_SECRET,
// //   pages: {
// //     signIn: "/",
// //     error: "/",
// //   },

// //   callbacks: {
// //     /** ---------------------------------------------------------
// //      *  jwt() – runs on sign-in **and** on every session check
// //      * --------------------------------------------------------- */
// //     async jwt({ token, account, profile }) {
// //      if (account) {
// //   token.accessToken = account.access_token;
// //   token.refreshToken = account.refresh_token;
// //   token.accessTokenExpires = account.expires_at * 1000;
// //   token.twitterId = profile.data.id;

// //   // ⬇ Save or update user in DB here
// //   await prisma.user.upsert({
// //     where: { twitterId: token.twitterId },
// //     update: {
// //       accessToken: token.accessToken,
// //       refreshToken: token.refreshToken,
// //       name: profile.data.name ?? "",
// //       image: profile.data.profile_image_url ?? "",
// //     },
// //     create: {
// //       twitterId: token.twitterId,
// //       accessToken: token.accessToken,
// //       refreshToken: token.refreshToken,
// //       name: profile.data.name ?? "",
// //       image: profile.data.profile_image_url ?? "",
// //     },
// //   });

// //   return token;
// // }

// //     },

// //     /** ---------------------------------------------------------
// //      *  session() – expose fields to server-side `getServerSession`
// //      * --------------------------------------------------------- */
// //     async session({ session, token }) {
// //       // @ts-ignore – NextAuth typings are a bit loose
// //       session.user = session.user ?? {};

// //       session.user.accessToken = token.accessToken as string | undefined;
// //       session.user.refreshToken = token.refreshToken as string | undefined;
// //       session.user.twitterId = token.twitterId as string | undefined;
// //       session.user.accessTokenExpires = token.accessTokenExpires as number | undefined;

// //       // Optional: surface refresh errors to the client
// //       if (token.error) session.error = token.error as string;

// //       return session;
// //     },
// //   },

// //   // -----------------------------------------------------------------
// //   // Debug mode prints everything NextAuth does – super handy locally
// //   // -----------------------------------------------------------------
// //   debug: process.env.NODE_ENV === "development",
// // };

// // export default authOptions;
// import TwitterProvider from "next-auth/providers/twitter";
// import { NextAuthOptions } from "next-auth";
// import { JWT } from "next-auth/jwt";

// // Helper function to get Prisma client with dynamic import
// async function getPrisma() {
//   const { prisma } = await import("./prisma");
//   return prisma;
// }

// async function refreshAccessToken(token: JWT): Promise<JWT> {
//   try {
//     const url = "https://api.twitter.com/2/oauth2/token";

//     const body = new URLSearchParams({
//       grant_type: "refresh_token",
//       refresh_token: token.refreshToken as string,
//       client_id: process.env.TWITTER_CLIENT_ID!,
//     });

//     const res = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       body,
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       console.error("[auth] Token refresh failed", res.status, data);
//       throw data;
//     }

//     console.log("[auth] Token refreshed – new expiry in", data.expires_in, "s");

//     return {
//       ...token,
//       accessToken: data.access_token,
//       accessTokenExpires: Date.now() + (data.expires_in ?? 7200) * 1000,
//       refreshToken: data.refresh_token ?? token.refreshToken,
//     };
//   } catch (err) {
//     console.error("[auth] refreshAccessToken error:", err);
//     return {
//       ...token,
//       error: "RefreshAccessTokenError",
//     };
//   }
// }

// export const authOptions: NextAuthOptions = {
//   providers: [
//     TwitterProvider({
//       clientId: process.env.TWITTER_CLIENT_ID!,
//       clientSecret: process.env.TWITTER_CLIENT_SECRET!,
//       version: "2.0",
//       authorization: {
//         params: {
//           scope: "tweet.read tweet.write users.read offline.access",
//         },
//       },
//     }),
//   ],

//   secret: process.env.NEXTAUTH_SECRET,
//   pages: {
//     signIn: "/",
//     error: "/",
//   },

//   callbacks: {
//     async jwt({ token, account, profile }) {
//       // Initial sign in
//       if (account && profile) {
//         token.accessToken = account.access_token;
//         token.refreshToken = account.refresh_token;
//         token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : Date.now() + 7200 * 1000;
//         token.twitterId = (profile as any).data?.id;

//         // Save or update user in DB using dynamic import
//         try {
//           const prisma = await getPrisma();
          
//           if (token.twitterId) {
//             await prisma.user.upsert({
//               where: { twitterId: token.twitterId },
//               update: {
//                 accessToken: token.accessToken,
//                 refreshToken: token.refreshToken,
//                 name: (profile as any).data?.name ?? "",
//                 image: (profile as any).data?.profile_image_url ?? "",
//               },
//               create: {
//                 twitterId: token.twitterId,
//                 accessToken: token.accessToken,
//                 refreshToken: token.refreshToken,
//                 name: (profile as any).data?.name ?? "",
//                 image: (profile as any).data?.profile_image_url ?? "",
//               },
//             });
//           }
//         } catch (error) {
//           console.error("Failed to save user to database:", error);
//           // Don't throw error - allow login to continue even if DB fails
//         }

//         return token;
//       }

//       // Return previous token if the access token has not expired yet
//       if (Date.now() < (token.accessTokenExpires as number)) {
//         return token;
//       }

//       // Access token has expired, try to update it
//       return refreshAccessToken(token);
//     },

//     async session({ session, token }) {
//       session.user = session.user ?? {};
      
//       // Send properties to the client
//       session.user.accessToken = token.accessToken as string | undefined;
//       session.user.refreshToken = token.refreshToken as string | undefined;
//       session.user.twitterId = token.twitterId as string | undefined;
//       session.user.accessTokenExpires = token.accessTokenExpires as number | undefined;

//       if (token.error) {
//         session.error = token.error as string;
//       }

//       return session;
//     },
//   },

//   debug: process.env.NODE_ENV === "development",
// };
import TwitterProvider from "next-auth/providers/twitter";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";

// Helper function to get Prisma client with dynamic import
async function getPrisma() {
  const { prisma } = await import("./prisma");
  return prisma;
}

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        params: {
          scope: "tweet.read tweet.write users.read offline.access",
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
    async jwt({ token, account, profile }) {
      console.log("🔐 JWT Callback - Profile received:", profile);
      
      // Initial sign in
      if (account && profile) {
        console.log("🆕 New sign-in detected");
        
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : Date.now() + 7200 * 1000;
        token.twitterId = (profile as any).data?.id;

        console.log("📝 User data:", {
          twitterId: token.twitterId,
          name: (profile as any).data?.name,
          image: (profile as any).data?.profile_image_url,
          hasAccessToken: !!token.accessToken
        });

        // Save or update user in DB
        try {
          const prisma = await getPrisma();
          console.log("🗄️ Prisma client obtained");
          
          if (token.twitterId) {
            const userData = {
              twitterId: token.twitterId,
              accessToken: token.accessToken,
              refreshToken: token.refreshToken,
              name: (profile as any).data?.name || "Unknown",
              image: (profile as any).data?.profile_image_url || "",
            };

            console.log("💾 Attempting to save user:", userData);

            const dbUser = await prisma.user.upsert({
              where: { twitterId: token.twitterId },
              update: userData,
              create: userData,
            });

            console.log("✅ User saved to database:", dbUser);
          } else {
            console.log("❌ No twitterId found in profile");
          }
        } catch (error) {
          console.error("💥 Failed to save user to database:", error);
          // Don't throw - we want auth to succeed even if DB fails
        }

        return token;
      }

      // Return previous token if still valid
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Token refresh logic would go here
      return token;
    },

    async session({ session, token }) {
      console.log("🔗 Session Callback - Building session");
      
      session.user = session.user ?? {};
      
      // Send properties to the client
      session.user.accessToken = token.accessToken as string;
      session.user.refreshToken = token.refreshToken as string;
      session.user.twitterId = token.twitterId as string;
      session.user.accessTokenExpires = token.accessTokenExpires as number;

      console.log("🎯 Final session data:", {
        twitterId: session.user.twitterId,
        name: session.user.name,
        hasAccessToken: !!session.user.accessToken
      });

      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
};