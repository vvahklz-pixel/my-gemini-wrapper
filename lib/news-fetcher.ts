import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
  },
});

export type NewsCategory = 'domestic' | 'global' | 'markets' | 'macro';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  summary?: string;
  source: string;
  category: NewsCategory;
}

const NEWS_SOURCES: { name: string; url: string; category: NewsCategory }[] = [
  // 국내 경제
  { name: '한국경제', url: 'https://www.hankyung.com/feed/economy', category: 'domestic' },
  { name: '매일경제', url: 'https://www.mk.co.kr/rss/30000001/', category: 'domestic' },
  { name: '연합뉴스 경제', url: 'https://www.yna.co.kr/economy/all/rss', category: 'domestic' },
  { name: '이데일리', url: 'https://www.edaily.co.kr/rss/rssfeed.aspx?mediacd=E&catecode=E&type=atom', category: 'domestic' },
  { name: '머니투데이', url: 'https://rss.mt.co.kr/rss/section/rss_economy.xml', category: 'domestic' },
  { name: '파이낸셜뉴스', url: 'https://www.fnnews.com/rss/fn_economy.xml', category: 'domestic' },
  { name: '조선비즈', url: 'https://biz.chosun.com/arc/outboundfeeds/rss/category/economy/', category: 'domestic' },
  { name: '서울경제', url: 'https://www.sedaily.com/RSS/economy.xml', category: 'domestic' },
  // 국내 주식/투자
  { name: '한국경제 증권', url: 'https://www.hankyung.com/feed/finance', category: 'markets' },
  { name: '매일경제 증권', url: 'https://www.mk.co.kr/rss/50200011/', category: 'markets' },
  { name: '이데일리 증권', url: 'https://www.edaily.co.kr/rss/rssfeed.aspx?mediacd=E&catecode=S&type=atom', category: 'markets' },
  // 국내 부동산/거시
  { name: '한국경제 부동산', url: 'https://www.hankyung.com/feed/realestate', category: 'macro' },
  // 해외/글로벌
  { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'global' },
  { name: 'Reuters Economy', url: 'https://feeds.reuters.com/reuters/businessNews', category: 'global' },
  { name: 'CNBC Economy', url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html', category: 'global' },
  { name: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'global' },
  { name: 'FT Markets', url: 'https://www.ft.com/markets?format=rss', category: 'global' },
  { name: 'Investing.com', url: 'https://www.investing.com/rss/news_25.rss', category: 'markets' },
];

function isWithinHours(dateStr: string, hours: number): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return date >= cutoff;
}

export async function fetchRecentNews(hoursBack = 24): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  const results = await Promise.allSettled(
    NEWS_SOURCES.map(async (source) => {
      const feed = await parser.parseURL(source.url);
      const items: NewsItem[] = [];

      for (const item of feed.items.slice(0, 20)) {
        const pubDate = item.pubDate || item.isoDate || '';
        if (!pubDate || isWithinHours(pubDate, hoursBack)) {
          items.push({
            title: item.title?.trim() || '(제목 없음)',
            link: item.link || '',
            pubDate: pubDate || new Date().toISOString(),
            summary: item.contentSnippet?.slice(0, 200),
            source: source.name,
            category: source.category,
          });
        }
      }

      return items;
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allNews.push(...result.value);
    }
  }

  allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return allNews;
}
