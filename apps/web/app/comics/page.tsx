// apps/web/app/comics/page.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comics | TheGameBit",
  description: "Dive into comics, manga, and graphic novels.",
};

export default function ComicsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Comics
      </h1>
      <p className="mt-4 text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Dive into comics, manga, and graphic novels.
      </p>
    </main>
  );
}
