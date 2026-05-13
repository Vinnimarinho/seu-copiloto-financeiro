import { Helmet } from "react-helmet-async";

const SITE = "https://luciusinvest.com.br";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  /** Optional JSON-LD blobs to embed alongside the page meta. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** When true, marks the route as noindex (use for private/transactional pages). */
  noindex?: boolean;
}

/**
 * Per-route head management. Overrides the static tags in index.html
 * for the duration the component is mounted.
 */
export function SEO({ title, description, path = "/", jsonLd, noindex }: SEOProps) {
  const url = `${SITE}${path}`;
  const blobs = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {blobs.map((blob, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(blob)}
        </script>
      ))}
    </Helmet>
  );
}
