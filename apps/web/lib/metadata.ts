// apps/web/lib/metadata.ts

import type { Metadata } from "next";
import type { SEOMeta } from "@/types";

const SITE_NAME = "TheGameBit";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thegamebit.com";

// ─── Base metadata shared by all pages ───────────────────────────────────────

export const baseMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: BASE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    site: "@thegamebit",
  },
};

// ─── Per-page metadata builder ────────────────────────────────────────────────

export function buildMetadata(
  seo: SEOMeta,
  overrides?: Partial<Metadata>
): Metadata {
  const ogImage = seo.ogImage ?? `${BASE_URL}/og-default.jpg`;

  return {
    ...baseMetadata,
    title: { default: seo.title, template: `%s | ${SITE_NAME}` },
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: seo.canonical },
    openGraph: {
      ...baseMetadata.openGraph,
      title: seo.title,
      description: seo.description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: seo.title }],
    },
    twitter: {
      ...baseMetadata.twitter,
      title: seo.title,
      description: seo.description,
      images: [ogImage],
    },
    ...overrides,
  };
}

// ─── JSON-LD structured data helpers ─────────────────────────────────────────

export function videoGameJsonLd(name: string, description: string, image: string) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name,
    description,
    image,
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}

export function personJsonLd(name: string, description: string, image: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    description,
    image,
  };
}