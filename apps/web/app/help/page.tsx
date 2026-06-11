// apps/web/app/help/page.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | TheGameBit",
  description: "Find answers, guides, and support resources.",
};

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Help Center
      </h1>
      <p className="mt-4 text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Find answers, guides, and support resources.
      </p>
    </main>
  );
}
