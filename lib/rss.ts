import { XMLParser } from 'fast-xml-parser';

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
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
        .slice(0, 15)
        .map((item) => ({
          title: stripHtml(extractText(item['title'])),
          description: stripHtml(
            extractText(item['description'] || item['content:encoded'] || '')
          ).slice(0, 400),
          link: extractLink(item),
          pubDate: extractText(item['pubDate'] || item['dc:date'] || ''),
          source: sourceName,
        }))
        .filter((i) => i.title);
    }

    // Atom
    const feed = parsed?.feed;
    if (feed) {
      const entries: Record<string, unknown>[] = feed.entry || [];
      return entries
        .slice(0, 15)
        .map((entry) => ({
          title: stripHtml(extractText(entry['title'])),
          description: stripHtml(
            extractText(
              (entry['summary'] as Record<string, unknown>)?.['#text'] ||
                entry['summary'] ||
                (entry['content'] as Record<string, unknown>)?.['#text'] ||
                entry['content'] ||
                ''
            )
          ).slice(0, 400),
          link: extractLink(entry),
          pubDate: extractText(entry['published'] || entry['updated'] || ''),
          source: sourceName,
        }))
        .filter((i) => i.title);
    }

    console.warn(`[RSS] Unknown feed format: ${sourceName}`);
    return [];
  } catch (e) {
    console.error(`[RSS] Failed ${sourceName}: ${(e as Error).message}`);
    return [];
  }
}
