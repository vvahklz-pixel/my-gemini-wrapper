'use client';

import type { MarketData } from '@/app/types';
import { formatPrice } from '@/app/utils/format';
import Sparkline from './Sparkline';

function vixColor(price: number): string {
  if (price >= 30) return 'text-[#991B1B]';
  if (price >= 20) return 'text-[#F97316]';
  return 'text-[#EF4444]';
}

function TickerItem({
  market,
  isSelected,
  onClick,
}: {
  market: MarketData;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isUp = market.change >= 0;
  const hasData = market.price > 0;
  const isVix = market.symbol === '^VIX';

  return (
    <button
      onClick={onClick}
      className={`flex-none flex items-center gap-3 px-4 py-2.5 border-r border-white/5 transition-colors ${
        isSelected ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
    >
      <div className="text-left min-w-0">
        <p className="text-[10px] font-semibold text-white/50 leading-none mb-1 whitespace-nowrap">{market.nameKr}</p>
        {hasData ? (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`text-sm font-bold ${isVix ? vixColor(market.price) : 'text-white'}`}>
              {formatPrice(market.price, market.currency)}
            </span>
            <span className={`text-[11px] font-medium ${isUp ? 'text-[#1AC47D]' : 'text-[#F04452]'}`}>
              {isUp ? '▲' : '▼'} {Math.abs(market.changePercent).toFixed(2)}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-white/25 whitespace-nowrap">데이터 없음</span>
        )}
      </div>
      {hasData && market.closes.length > 1 && (
        <Sparkline closes={market.closes} width={56} height={26} isUp={isUp} />
      )}
    </button>
  );
}

export default function TickerBar({
  markets,
  selectedSymbol,
  onSelect,
  onRefresh,
}: {
  markets: MarketData[];
  selectedSymbol: string | null;
  onSelect: (market: MarketData) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex-none bg-[#0D1117] border-b border-white/5">
      <div className="flex overflow-x-auto scrollbar-hide">
        {markets.map((m) => (
          <TickerItem key={m.symbol} market={m} isSelected={selectedSymbol === m.symbol} onClick={() => onSelect(m)} />
        ))}
        <div className="flex-none flex items-center px-3 ml-auto">
          <button
            onClick={onRefresh}
            title="시장 데이터 새로고침"
            className="p-1.5 rounded-full text-white/25 hover:text-white/60 hover:bg-white/10 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
