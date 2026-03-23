import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

const SYMBOLS = [
  { symbol: '^GSPC', nameKr: 'S&P 500', type: 'index' as const },
  { symbol: '^IXIC', nameKr: '나스닥', type: 'index' as const },
  { symbol: '^DJI', nameKr: '다우존스', type: 'index' as const },
  { symbol: '^KS11', nameKr: '코스피', type: 'index' as const },
  { symbol: '^KQ11', nameKr: '코스닥', type: 'index' as const },
  { symbol: 'GC=F', nameKr: '금', type: 'commodity' as const },
  { symbol: 'KRW=X', nameKr: '달러/원', type: 'forex' as const },
  { symbol: '^VIX', nameKr: 'VIX', type: 'volatility' as const },
];

type MarketEntry = Omit<(typeof SYMBOLS)[number], 'type'> & {
  type: 'index' | 'commodity' | 'forex' | 'volatility';
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  currency: string;
  closes: (number | null)[];
  marketState: string;
  error?: string;
};

interface Cache {
  data: { markets: MarketEntry[]; updatedAt: string };
  ts: number;
}

let cache: Cache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function buildMarkets(): Promise<MarketEntry[]> {
  const symbolList = SYMBOLS.map((s) => s.symbol);

  // Single batch request for all quotes
  const quotes = await yf.quote(symbolList);
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  // Fetch chart data sequentially to avoid rate limiting
  const ago30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const chartMap = new Map<string, (number | null)[]>();
  for (const { symbol } of SYMBOLS) {
    try {
      const chart = await yf.chart(symbol, { period1: ago30, interval: '1d' });
      chartMap.set(symbol, chart.quotes.map((q) => q.close ?? null));
    } catch {
      chartMap.set(symbol, []);
    }
  }

  return SYMBOLS.map((item) => {
    const q = quoteMap.get(item.symbol);
    if (!q) {
      return {
        ...item,
        price: 0, change: 0, changePercent: 0, prevClose: 0,
        open: 0, high: 0, low: 0, currency: '',
        closes: [], marketState: 'CLOSED',
        error: 'No quote data',
      };
    }
    return {
      ...item,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      prevClose: q.regularMarketPreviousClose ?? 0,
      open: q.regularMarketOpen ?? 0,
      high: q.regularMarketDayHigh ?? 0,
      low: q.regularMarketDayLow ?? 0,
      currency: q.currency ?? '',
      closes: chartMap.get(item.symbol) ?? [],
      marketState: q.marketState ?? 'CLOSED',
    };
  });
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return Response.json(cache.data);
  }

  try {
    const markets = await buildMarkets();
    const data = { markets, updatedAt: new Date().toISOString() };
    cache = { data, ts: Date.now() };
    return Response.json(data);
  } catch (err) {
    // Return stale cache if available rather than failing
    if (cache) return Response.json(cache.data);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch market data' },
      { status: 500 },
    );
  }
}
