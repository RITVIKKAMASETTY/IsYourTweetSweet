// // src/app/api/debug/env/route.js
// import { NextResponse } from "next/server";

// export async function GET() {
//   return NextResponse.json({
//     TWITTER_CLIENT_ID_set: !!process.env.TWITTER_CLIENT_ID,
//     TWITTER_CLIENT_SECRET_set: !!process.env.TWITTER_CLIENT_SECRET,
//     NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
//     NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
//     NEXTGRQ: process.env.NEXTGRQ || null
//   });
// }
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  const prisma = await getPrisma();
  const allUsers = await prisma.user.findMany();
  const allTweets = await prisma.tweet.findMany();

  return NextResponse.json({
    session: {
      hasSession: !!session,
      user: session?.user ? {
        twitterId: session.user.twitterId,
        name: session.user.name,
        hasAccessToken: !!session.user.accessToken
      } : null
    },
    database: {
      users: allUsers,
      tweets: allTweets
    }
  });
}