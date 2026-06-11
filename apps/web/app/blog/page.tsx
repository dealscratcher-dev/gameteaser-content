// apps/web/app/blog/page.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | TheGameBit",
  description: "News, updates, and stories from TheGameBit.",
};

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Blog
      </h1>
      <p className="mt-4 text-white/50 font-[family-name:var(--font-ibm-plex)]">
        News, updates, and stories from TheGameBit.
      </p>
    </main>
  );
}
