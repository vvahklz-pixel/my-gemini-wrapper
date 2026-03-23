export interface NewsSource {
  name: string;
  url: string;
  language: 'ko' | 'en';
}

// 국내 경제 뉴스 — 작동 확인된 소스 + Google News 보강
export const KOREAN_SOURCES: NewsSource[] = [
  // 직접 RSS — 작동 확인
  { name: '한국경제', url: 'https://www.hankyung.com/feed/economy', language: 'ko' },
  { name: '한국경제 금융', url: 'https://www.hankyung.com/feed/finance', language: 'ko' },
  { name: '서울경제', url: 'https://www.sedaily.com/rss/economy', language: 'ko' },
  { name: '아시아경제', url: 'https://www.asiae.co.kr/rss/all.htm', language: 'ko' },
  { name: '헤럴드경제', url: 'https://biz.heraldcorp.com/rss/google/economy', language: 'ko' },
  // 직접 RSS — 앱 환경(Mozilla UA)에서 접근 가능할 수 있음
  { name: '매일경제', url: 'https://www.mk.co.kr/rss/30000001/', language: 'ko' },
  { name: '연합뉴스', url: 'https://www.yna.co.kr/rss/economy.xml', language: 'ko' },
  { name: '조선비즈', url: 'https://biz.chosun.com/arc/outboundfeeds/rss/?outputType=xml', language: 'ko' },
  // Google News 한국 경제 — 안정적 보강 소스
  { name: 'Google뉴스 경제', url: 'https://news.google.com/rss/search?q=%ED%95%9C%EA%B5%AD+%EA%B2%BD%EC%A0%9C+%EA%B8%88%EB%A6%AC&hl=ko&gl=KR&ceid=KR:ko', language: 'ko' },
  { name: 'Google뉴스 주식', url: 'https://news.google.com/rss/search?q=%EC%BD%94%EC%8A%A4%ED%94%BC+%EC%BD%94%EC%8A%A4%EB%8B%A5+%EC%A3%BC%EC%8B%9D&hl=ko&gl=KR&ceid=KR:ko', language: 'ko' },
  { name: 'Google뉴스 부동산', url: 'https://news.google.com/rss/search?q=%ED%95%9C%EA%B5%AD+%EB%B6%80%EB%8F%99%EC%82%B0+%EC%A0%95%EC%B1%85&hl=ko&gl=KR&ceid=KR:ko', language: 'ko' },
  { name: 'Google뉴스 기업', url: 'https://news.google.com/rss/search?q=%EC%82%BC%EC%84%B1+%ED%98%84%EB%8C%80+SK+%EC%8B%A4%EC%A0%81&hl=ko&gl=KR&ceid=KR:ko', language: 'ko' },
];

// 글로벌 경제/금융 뉴스 — 세계적으로 신뢰받는 소스들
export const GLOBAL_SOURCES: NewsSource[] = [
  { name: 'CNBC Finance', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', language: 'en' },
  { name: 'CNBC Economy', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839135', language: 'en' },
  { name: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', language: 'en' },
  { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', language: 'en' },
  { name: 'The Guardian Business', url: 'https://www.theguardian.com/business/rss', language: 'en' },
  { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', language: 'en' },
  { name: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml', language: 'en' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', language: 'en' },
  { name: 'SemiAnalysis', url: 'https://semianalysis.com/feed', language: 'en' },
];
