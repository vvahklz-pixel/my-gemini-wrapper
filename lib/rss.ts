import { XMLParser } from 'fast-xml-parser';

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  imageUrl?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => ['item', 'entry'].includes(name),
});

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractText(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    return String(obj['#text'] || obj['_'] || '');
  }
  return String(val);
}

function asArray<T>(val: unknown): T[] {
  if (!val) return [];
  return Array.isArray(val) ? (val as T[]) : [val as T];
}

function extractImage(item: Record<string, unknown>, rawDesc: string): string | undefined {
  // 1. media:content
  for (const m of asArray<Record<string, unknown>>(item['media:content'])) {
    const url = m['@_url'] as string | undefined;
    if (url) return url;
  }

  // 2. media:thumbnail
  for (const m of asArray<Record<string, unknown>>(item['media:thumbnail'])) {
    const url = m['@_url'] as string | undefined;
    if (url) return url;
  }

  // 3. enclosure with image type
  const enc = item['enclosure'] as Record<string, unknown> | undefined;
  if (enc) {
    const type = String(enc['@_type'] || '');
    const url = enc['@_url'] as string | undefined;
    if (url && type.startsWith('image/')) return url;
  }

  // 4. <img src="..."> in raw description HTML (before stripHtml)
  const imgMatch = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return undefined;
}

function extractLink(item: Record<string, unknown>): string {
  const link = item['link'];
  if (!link) return '';
  if (typeof link === 'string') return link;
  if (Array.isArray(link)) {
    const alt = (link as Record<string, unknown>[]).find((l) => l['@_rel'] === 'alternate') || link[0];
    return (alt as Record<string, unknown>)['@_href'] as string || extractText(alt);
  }
  const lo = link as Record<string, unknown>;
  return (lo['@_href'] as string) || extractText(link);
}

export async function fetchFeed(url: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const parsed = parser.parse(xml);

    // RSS 2.0
    const channel = parsed?.rss?.channel;
    if (channel) {
      const items: Record<string, unknown>[] = channel.item || [];
      return items
        .slice(0, 20)
        .map((item) => {
          const rawDesc = extractText(item['description'] || item['content:encoded'] || '');
          return {
            title: stripHtml(extractText(item['title'])),
            description: stripHtml(rawDesc).slice(0, 400),
            link: extractLink(item),
            pubDate: extractText(item['pubDate'] || item['dc:date'] || ''),
            source: sourceName,
            imageUrl: extractImage(item, rawDesc),
          };
        })
        .filter((i) => i.title);
    }

    // Atom
    const feed = parsed?.feed;
    if (feed) {
      const entries: Record<string, unknown>[] = feed.entry || [];
      return entries
        .slice(0, 20)
        .map((entry) => {
          const rawDesc = extractText(
            (entry['summary'] as Record<string, unknown>)?.['#text'] ||
              entry['summary'] ||
              (entry['content'] as Record<string, unknown>)?.['#text'] ||
              entry['content'] ||
              ''
          );
          return {
            title: stripHtml(extractText(entry['title'])),
            description: stripHtml(rawDesc).slice(0, 400),
            link: extractLink(entry),
            pubDate: extractText(entry['published'] || entry['updated'] || ''),
            source: sourceName,
            imageUrl: extractImage(entry, rawDesc),
          };
        })
        .filter((i) => i.title);
    }

    console.warn(`[RSS] Unknown feed format: ${sourceName}`);
    return [];
  } catch (e) {
    console.error(`[RSS] Failed ${sourceName}: ${(e as Error).message}`);
    return [];
  }
}
