// apps/web/app/community/hubs/page.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fan Hubs | TheGameBit",
  description: "Join fan communities and connect with others.",
};

export default function CommunityHubsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Fan Hubs
      </h1>
      <p className="mt-4 text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Join fan communities and connect with others.
      </p>
    </main>
  );
}
