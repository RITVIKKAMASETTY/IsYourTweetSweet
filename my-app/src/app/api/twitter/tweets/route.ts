// src/app/api/twitter/tweets/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";

export async function GET(req) {
  const session = await getServerSession(authOptions);

  // getServerSession(authOptions) without args works in app router.
  // session may be null if not authenticated.
  if (!session?.user?.accessToken || !session?.user?.twitterId) {
    return new NextResponse(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const accessToken = session.user.accessToken;
  const userId = session.user.twitterId;

  try {
    const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,text,author_id`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const text = await r.text();
    if (!r.ok) {
      return new NextResponse(text || JSON.stringify({ error: "Twitter API error" }), { status: r.status });
    }

    return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: "Server error", detail: err.message }), { status: 500 });
  }
}
