// content.ts – utility to fetch static content with optional caching

/**
 * Fetch JSON content from a given URL.
 * Uses the browser `caches` API (if available) to store the response for
 * subsequent calls. The cache name is `content-cache`.
 *
 * @param url - The absolute or relative URL to fetch.
 * @param useCache - Whether to use the Cache storage. Defaults to true.
 * @returns Parsed JSON object.
 */
export async function fetchContent<T = any>(
  url: string,
  useCache: boolean = true
): Promise<T> {
  // If the Cache API is available and caching is desired, attempt a cache hit.
  if (useCache && typeof caches !== 'undefined') {
    const cache = await caches.open('content-cache');
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      return cachedResponse.json();
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    // Store a clone for future use.
    await cache.put(url, response.clone());
    return response.json();
  }

  // Fallback to a plain fetch if Cache API is unavailable.
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.json();
}

/**
 * Convenience wrapper that reads a JSON file bundled with the app (e.g. in
 * `public/data/…`). It resolves the path relative to the site root.
 */
export async function getStaticJson<T = any>(path: string): Promise<T> {
  const url = path.startsWith('/') ? path : `/${path}`;
  return fetchContent<T>(url);
}

export default { fetchContent, getStaticJson };
