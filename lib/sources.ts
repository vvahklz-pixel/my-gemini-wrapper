export interface NewsSource {
  name: string;
  url: string;
  language: 'ko' | 'en';
}

// 국내 경제 뉴스 — 신뢰도 높은 소스들
export const KOREAN_SOURCES: NewsSource[] = [
  { name: '한국경제', url: 'https://www.hankyung.com/feed/economy', language: 'ko' },
  { name: '매일경제', url: 'https://www.mk.co.kr/rss/30000001/', language: 'ko' },
  { name: '연합뉴스', url: 'https://www.yna.co.kr/economy/all/rss.xml', language: 'ko' },
  { name: '이데일리', url: 'https://www.edaily.co.kr/rss/rssxml.asp?ml_sdno=1', language: 'ko' },
  { name: '머니투데이', url: 'https://rss.mt.co.kr/mt_recent.xml', language: 'ko' },
  { name: '뉴스1 경제', url: 'https://www.news1.kr/rss/?cid=501', language: 'ko' },
];

// 글로벌 경제/금융 뉴스 — 세계적으로 신뢰받는 소스들
export const GLOBAL_SOURCES: NewsSource[] = [
  { name: 'CNBC Economy', url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html', language: 'en' },
  { name: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', language: 'en' },
  { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories/', language: 'en' },
  { name: 'The Guardian Business', url: 'https://www.theguardian.com/business/rss', language: 'en' },
  { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', language: 'en' },
];
