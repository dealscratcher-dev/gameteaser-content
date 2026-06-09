// og.tsx – Open Graph meta tag component for Next.js
import Head from 'next/head';

export interface OGProps {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string; // e.g., "website", "article"
  locale?: string; // e.g., "en_US"
}

/**
 * Renders standard Open Graph meta tags. Use inside a page component's JSX.
 * Example:
 * <OG title="My Page" description="Short desc" url="https://example.com/page" image="/og.png" />
 */
export const OG = ({
  title,
  description = '',
  url = '',
  image = '',
  type = 'website',
  locale = 'en_US',
}: OGProps) => (
  <Head>
    <meta property="og:title" content={title} />
    {description && <meta property="og:description" content={description} />}
    <meta property="og:type" content={type} />
    {url && <meta property="og:url" content={url} />}
    {image && <meta property="og:image" content={image} />}
    <meta property="og:locale" content={locale} />
    {/* Twitter cards – optional but useful */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    {description && <meta name="twitter:description" content={description} />}
    {image && <meta name="twitter:image" content={image} />}
  </Head>
);

export default OG;
