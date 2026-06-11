// apps/web/app/advertise/page.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise | TheGameBit",
  description: "Reach millions of fans through TheGameBit.",
};

export default function AdvertisePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-extrabold uppercase tracking-tight text-white">
        Advertise
      </h1>
      <p className="mt-4 text-white/50 font-[family-name:var(--font-ibm-plex)]">
        Reach millions of fans through TheGameBit.
      </p>
    </main>
  );
}
