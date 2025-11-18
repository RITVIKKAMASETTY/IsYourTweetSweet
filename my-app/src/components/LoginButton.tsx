// src/components/LoginButton.tsx
"use client";
import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function LoginButton() {
  const { data: session } = useSession();


  if (!session) {
    return <button onClick={() => signIn("twitter")}>Sign in with X (Twitter)</button>;
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {session.user?.image && <img src={session.user.image} alt="avatar" width={32} height={32} style={{ borderRadius: 16 }} />}
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
