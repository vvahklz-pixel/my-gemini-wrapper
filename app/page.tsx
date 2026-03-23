'use client';

import { useEffect, useState } from 'react';
import { useDigest } from '@/app/hooks/useDigest';
import { useMarkets } from '@/app/hooks/useMarkets';
import TickerBar from '@/app/components/TickerBar';
import MarketDetailPanel from '@/app/components/MarketDetailPanel';
import KeywordCloud from '@/app/components/KeywordCloud';
import SkeletonCard from '@/app/components/SkeletonCard';
import InsightsCard from '@/app/components/InsightsCard';
import SectionCard from '@/app/components/SectionCard';
import ChatPanel, { type Message as ChatMessage } from '@/app/components/ChatPanel';

const TABS = [
  { id: 'all', label: '전체' },
  { id: 'korean', label: '국내경제' },
  { id: 'global', label: '해외경제' },
  { id: 'keywords', label: '키워드' },
  { id: 'chat', label: 'AI 상담' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Home() {
  const { digest, loading, error, fetchDigest } = useDigest();
  const { markets, selectedMarket, setSelectedMarket, fetchMarkets, toggleMarket } = useMarkets();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    fetchDigest();
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDigest, fetchMarkets]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  const hour = now.getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '좋은 오후예요' : '좋은 저녁이에요';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F5F6F8]">

      {/* Ticker bar */}
      {markets.length > 0 && (
        <TickerBar
          markets={markets}
          selectedSymbol={selectedMarket?.symbol ?? null}
          onSelect={toggleMarket}
          onRefresh={fetchMarkets}
        />
      )}

      {/* Header */}
      <div className="flex-none bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E5E8EB] px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8B95A1]">{dateStr}</p>
            <h1 className="text-xl font-bold text-[#191F28] mt-0.5">{greeting} 👋</h1>
          </div>
          <button
            onClick={() => fetchDigest(true)}
            disabled={loading}
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#3182F6] disabled:opacity-40 transition-opacity active:scale-95"
            aria-label="새로고침"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        {digest && (
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-[#3182F6] text-white shadow-sm' : 'bg-white text-[#8B95A1]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex min-h-0">

        {/* Chat tab — full height layout */}
        {activeTab === 'chat' && (
          <div className="flex-1 min-w-0 flex flex-col bg-[#F5F6F8]">
            <ChatPanel digest={digest} messages={chatMessages} setMessages={setChatMessages} />
          </div>
        )}

        {/* News column */}
        {activeTab !== 'chat' && <div className="flex-1 overflow-y-auto min-w-0">
          <div className="px-5 py-4 space-y-3 pb-12">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">{error}</div>
            )}

            {loading && !digest && (
              <>
                <SkeletonCard lines={5} />
                <SkeletonCard lines={4} />
                <SkeletonCard lines={4} />
              </>
            )}

            {digest && (
              <>
                <div className="flex items-center gap-2 text-xs text-[#8B95A1]">
                  <span>{digest.date}</span>
                  {digest.cached && (
                    <span className="bg-gray-100 text-[#8B95A1] px-2 py-0.5 rounded-full">캐시됨</span>
                  )}
                </div>

                {activeTab === 'all' && (
                  <>
                    {/* 분석 현황 */}
                    {(digest.newsCount || digest.generatedAt) && (
                      <div className="flex items-center gap-1.5 text-xs text-[#8B95A1] bg-white rounded-xl px-4 py-2.5">
                        <svg className="w-3.5 h-3.5 text-[#3182F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {digest.newsCount && (
                          <span>국내 <strong className="text-[#191F28]">{digest.newsCount.korean}</strong>건 · 글로벌 <strong className="text-[#191F28]">{digest.newsCount.global}</strong>건 분석</span>
                        )}
                        {digest.generatedAt && (
                          <span className="ml-auto text-[#B0B8C1]">
                            업데이트 {new Date(digest.generatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}
                    <InsightsCard
                      insights={digest.investmentInsights}
                      koreanHeadlines={digest.korean.headlines}
                      globalHeadlines={digest.global.headlines}
                    />
                    <div className="flex flex-col md:flex-row gap-3 items-start">
                      <div className="flex-1 min-w-0">
                        <SectionCard title="국내 경제 요약" badge="국내" summary={digest.korean.summary} macroView={digest.korean.macroView} realEstateView={digest.korean.realEstateView} techView={digest.korean.techView} signal={digest.korean.signal} signalReason={digest.korean.signalReason} riskLevel={digest.korean.riskLevel} keyThemes={digest.korean.keyThemes} headlines={digest.korean.headlines} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <SectionCard title="글로벌 경제 요약" badge="해외" summary={digest.global.summary} macroView={digest.global.macroView} realEstateView={digest.global.realEstateView} techView={digest.global.techView} signal={digest.global.signal} signalReason={digest.global.signalReason} riskLevel={digest.global.riskLevel} keyThemes={digest.global.keyThemes} headlines={digest.global.headlines} />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'korean' && (
                  <SectionCard title="국내 경제" badge="국내" summary={digest.korean.summary} macroView={digest.korean.macroView} realEstateView={digest.korean.realEstateView} techView={digest.korean.techView} signal={digest.korean.signal} signalReason={digest.korean.signalReason} riskLevel={digest.korean.riskLevel} keyThemes={digest.korean.keyThemes} headlines={digest.korean.headlines} />
                )}

                {activeTab === 'global' && (
                  <SectionCard title="글로벌 경제" badge="해외" summary={digest.global.summary} macroView={digest.global.macroView} realEstateView={digest.global.realEstateView} techView={digest.global.techView} signal={digest.global.signal} signalReason={digest.global.signalReason} riskLevel={digest.global.riskLevel} keyThemes={digest.global.keyThemes} headlines={digest.global.headlines} />
                )}

                {activeTab === 'keywords' && (
                  <KeywordCloud
                    koreanKeywords={digest.korean.keywords ?? []}
                    globalKeywords={digest.global.keywords ?? []}
                    koreanHeadlines={digest.korean.headlines}
                    globalHeadlines={digest.global.headlines}
                    koreanRawItems={digest.korean.rawItems ?? []}
                    globalRawItems={digest.global.rawItems ?? []}
                  />
                )}

                <p className="text-center text-xs text-[#B0B8C1] pt-2">매일 오전 8시 자동 업데이트</p>

                {/* 면책 고지 */}
                <div className="mt-4 px-1">
                  <p className="text-[10px] text-[#B0B8C1] leading-relaxed text-center">
                    ⚠️ 본 서비스는 AI가 뉴스를 자동 분석한 참고 정보로, 투자 권유나 금융 조언이 아닙니다.<br />
                    투자 결정은 반드시 본인의 판단과 책임 하에 이루어져야 하며, 이로 인한 손실에 대해 어떠한 법적 책임도 지지 않습니다.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>}

        {/* Market detail sidebar (desktop) */}
        {selectedMarket && (
          <div className="hidden lg:flex w-[380px] flex-none border-l border-[#E5E8EB] bg-white overflow-y-auto flex-col">
            <MarketDetailPanel market={selectedMarket} onClose={() => setSelectedMarket(null)} />
          </div>
        )}
      </div>

      {/* Market detail bottom sheet (mobile) */}
      {selectedMarket && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedMarket(null)} />
          <div className="relative bg-white rounded-t-3xl h-[72vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex-none flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#E5E8EB]" />
            </div>
            <MarketDetailPanel market={selectedMarket} onClose={() => setSelectedMarket(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
