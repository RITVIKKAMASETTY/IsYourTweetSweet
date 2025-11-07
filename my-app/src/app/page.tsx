// src/app/page.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type Tweet = {
  id: string;
  text: string;
  created_at?: string;
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const [tweets, setTweets] = useState<Tweet[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setTweets(null);
      return;
    }

    const fetchTweets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/twitter/tweets");

        if (!res.ok) {
          // Try to parse an error body, otherwise throw generic
          let body: any = {};
          try {
            body = await res.json();
          } catch (e) {
            /* ignore parse errors */
          }
          throw new Error(body?.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setTweets(data?.data || []);
      } catch (err: unknown) {
        // Narrow unknown to string safely
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
  }, [session]);

  if (status === "loading") return <p>Loading session...</p>;

  return (
    <main style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <h1>Is Your Tweet Sweet — Emotion Detector</h1>

      {!session ? (
        <>
          <p>You are not signed in.</p>
          <button onClick={() => signIn("twitter")}>Sign in with X (Twitter)</button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {session.user?.image && (
              <img
                src={session.user.image}
                alt="avatar"
                width={48}
                height={48}
                style={{ borderRadius: 24 }}
              />
            )}
            <div>
              <strong>{session.user?.name}</strong>
              <div style={{ fontSize: 12, color: "#666" }}>
                {session.user?.email || session.user?.twitterId}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <button onClick={() => signOut()}>Sign out</button>
            </div>
          </div>

          <hr style={{ margin: "16px 0" }} />

          <h2>Your recent tweets</h2>

          {loading && <p>Loading tweets...</p>}
          {error && <p style={{ color: "red" }}>Error: {error}</p>}

          {!loading && tweets && tweets.length === 0 && <p>No tweets found.</p>}

          <ul style={{ listStyle: "none", padding: 0 }}>
            {tweets &&
              tweets.map((t) => (
                <li key={t.id} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    {t.created_at ? new Date(t.created_at).toLocaleString() : ""}
                  </div>
                  <div style={{ marginTop: 6 }}>{t.text}</div>
                </li>
              ))}
          </ul>
        </>
      )}
    </main>
  );
}
