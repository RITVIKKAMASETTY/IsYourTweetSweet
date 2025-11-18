import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function GET() {
  try {
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
  } catch (error) {
    console.error("Debug route error:", error);
    return NextResponse.json(
      { error: "Debug route failed", details: String(error) },
      { status: 500 }
    );
  }
}