import type { Digest } from '@/lib/gemini';

export interface DigestResponse extends Digest {
  cached?: boolean;
  error?: string;
  newsCount?: { korean: number; global: number };
}

export interface MarketData {
  symbol: string;
  nameKr: string;
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
}

export interface MarketsResponse {
  markets: MarketData[];
  updatedAt: string;
}
