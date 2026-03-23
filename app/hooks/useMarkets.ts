import { useState, useCallback } from 'react';
import type { MarketData, MarketsResponse } from '@/app/types';

export function useMarkets() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<MarketData | null>(null);

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/markets');
      if (!res.ok) return;
      const data: MarketsResponse = await res.json();
      setMarkets(data.markets);
      setSelectedMarket((prev) =>
        prev ? (data.markets.find((m) => m.symbol === prev.symbol) ?? prev) : null,
      );
    } catch {
      // Non-critical — ticker failure is silent
    }
  }, []);

  const toggleMarket = useCallback((market: MarketData) => {
    setSelectedMarket((prev) => (prev?.symbol === market.symbol ? null : market));
  }, []);

  return { markets, selectedMarket, setSelectedMarket, fetchMarkets, toggleMarket };
}
