// src/app/api/twitter/tweets/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken || !session?.user?.twitterId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = session.user.accessToken as string;
  const userId = session.user.twitterId as string;

  try {
    const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,text,author_id`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const text = await r.text();
    if (!r.ok) {
      // forward the Twitter error payload
      try {
        // if it's JSON, return structured JSON
        const json = JSON.parse(text);
        return NextResponse.json(json, { status: r.status });
      } catch {
        return new NextResponse(text || JSON.stringify({ error: "Twitter API error" }), { status: r.status });
      }
    }

    return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Server error", detail }, { status: 500 });
  }
}
