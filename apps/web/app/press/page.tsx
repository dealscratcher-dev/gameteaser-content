// apps/web/app/press/page.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press Kit | TheGameBit",
  description: "Media resources and brand assets for TheGameBit.",
};

export default function PressPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Press Kit
      </h1>
      <p className="mt-4 text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Media resources and brand assets for TheGameBit.
      </p>
    </main>
  );
}
