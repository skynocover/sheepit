/**
 * Fetch the og:image URL from a given page URL.
 * Returns null if not found or on error.
 */
export const fetchOgImage = async (pageUrl: string): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SheepIt-Bot/1.0' },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();

    // Match <meta property="og:image" content="..."> in either attribute order
    const match =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    if (!match?.[1]) return null;

    const imgUrl = match[1];
    if (imgUrl.startsWith('http')) return imgUrl;
    if (imgUrl.startsWith('//')) return `https:${imgUrl}`;
    if (imgUrl.startsWith('/')) {
      const base = new URL(pageUrl);
      return `${base.origin}${imgUrl}`;
    }
    return imgUrl;
  } catch {
    return null;
  }
};
