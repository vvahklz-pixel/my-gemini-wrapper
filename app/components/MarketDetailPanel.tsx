'use client';

import type { MarketData } from '@/app/types';
import { formatPrice } from '@/app/utils/format';
import Sparkline from './Sparkline';

const MARKET_DESCRIPTIONS: Record<string, string> = {
  '^GSPC': '미국 S&P 500 지수는 미국 증권거래소에 상장된 500대 대형주를 추적하는 주요 주가지수로, 미국 전체 주식시장 시가총액의 약 80%를 대표합니다.',
  '^IXIC': '나스닥 종합지수는 나스닥 거래소에 상장된 약 3,000개 주식을 포함하며, 애플·마이크로소프트·엔비디아 등 기술주 비중이 높습니다.',
  '^DJI': '다우존스 산업평균지수(DJIA)는 미국 30대 우량 대기업 주가를 단순 평균한 지수로, 100년 넘게 미국 경제의 바로미터 역할을 해왔습니다.',
  '^KS11': '코스피(KOSPI)는 한국거래소(KRX) 유가증권시장에 상장된 전체 종목의 시가총액을 기준으로 산출하는 종합 주가지수입니다.',
  '^KQ11': '코스닥(KOSDAQ)은 중소·벤처기업 중심의 한국 주식시장으로, IT·바이오·콘텐츠 섹터 비중이 높습니다.',
  'GC=F': '금 선물 가격(트로이온스 당 USD)입니다. 달러 약세, 지정학적 위기, 인플레이션 기대 시 상승하는 대표적인 안전자산입니다.',
  'KRW=X': 'USD 대비 KRW 환율입니다. 수치가 높을수록 원화 약세를 의미하며, 수출기업 수익과 수입물가에 직접 영향을 줍니다.',
};

const STATE_LABELS: Record<string, string> = {
  REGULAR: '● 장중',
  PRE: '● 프리마켓',
  POST: '● 애프터마켓',
  CLOSED: '● 장마감',
  PREPRE: '● 프리마켓',
  POSTPOST: '● 애프터마켓',
};

export default function MarketDetailPanel({
  market,
  onClose,
}: {
  market: MarketData;
  onClose: () => void;
}) {
  const isUp = market.change >= 0;
  const hasData = market.price > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-[#E5E8EB]">
        <div>
          <p className="text-[10px] text-[#B0B8C1] font-mono tracking-wider">{market.symbol}</p>
          <h2 className="text-lg font-bold text-[#191F28] mt-0.5">{market.nameKr}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[#F5F6F8] flex items-center justify-center text-[#8B95A1] hover:bg-[#E5E8EB] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {hasData ? (
          <>
            {/* Price */}
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-[#191F28]">{formatPrice(market.price, market.currency)}</p>
                <span className="text-sm text-[#8B95A1]">{market.currency}</span>
              </div>
              <div className={`flex items-center gap-2 mt-1.5 ${isUp ? 'text-[#1AC47D]' : 'text-[#F04452]'}`}>
                <span className="text-lg font-semibold">
                  {isUp ? '▲' : '▼'} {Math.abs(market.change).toFixed(2)}
                </span>
                <span className="text-base font-medium">
                  ({isUp ? '+' : ''}{market.changePercent.toFixed(2)}%)
                </span>
              </div>
              <p className={`text-xs mt-1.5 ${market.marketState === 'REGULAR' ? 'text-[#1AC47D]' : 'text-[#B0B8C1]'}`}>
                {STATE_LABELS[market.marketState] ?? '● 알 수 없음'}
              </p>
            </div>

            {/* Chart */}
            {market.closes.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-[#8B95A1] mb-2">최근 30일 추이</p>
                <div className="bg-[#F5F6F8] rounded-xl p-3">
                  <Sparkline closes={market.closes} width={300} height={100} isUp={isUp} />
                </div>
              </div>
            )}

            {/* Stats */}
            <div>
              <p className="text-xs font-semibold text-[#8B95A1] mb-3">상세 정보</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '시가', value: formatPrice(market.open, market.currency) },
                  { label: '전일 종가', value: formatPrice(market.prevClose, market.currency) },
                  { label: '고가', value: formatPrice(market.high, market.currency) },
                  { label: '저가', value: formatPrice(market.low, market.currency) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#F5F6F8] rounded-xl p-3">
                    <p className="text-[11px] text-[#8B95A1] mb-1">{label}</p>
                    <p className="text-sm font-semibold text-[#191F28]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-[#B0B8C1] text-sm">데이터를 불러올 수 없습니다</div>
        )}

        {/* Description */}
        {MARKET_DESCRIPTIONS[market.symbol] && (
          <div className="bg-[#EBF3FE] rounded-xl p-4">
            <p className="text-[11px] font-semibold text-[#3182F6] mb-1.5">지수 정보</p>
            <p className="text-sm text-[#191F28] leading-relaxed">{MARKET_DESCRIPTIONS[market.symbol]}</p>
          </div>
        )}
      </div>
    </div>
  );
}
