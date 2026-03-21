'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Digest, HeadlineItem } from '@/lib/gemini';

interface DigestResponse extends Digest {
  cached?: boolean;
  error?: string;
}

const TABS = [
  { id: 'all', label: '전체' },
  { id: 'korean', label: '국내경제' },
  { id: 'global', label: '해외경제' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="h-3.5 bg-gray-100 rounded-full w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-100 rounded-full" style={{ width: `${90 - i * 10}%` }} />
      ))}
    </div>
  );
}

function InsightsCard({ insights }: { insights: string[] }) {
  return (
    <div className="bg-[#3182F6] rounded-2xl p-5 text-white">
      <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">오늘의 투자 인사이트</p>
      <ol className="space-y-3">
        {insights.map((insight, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/90">
            <span className="flex-none w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span>{insight}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SectionCard({
  title,
  summary,
  keyThemes,
  headlines,
  badge,
}: {
  title: string;
  summary: string;
  keyThemes: string[];
  headlines: HeadlineItem[];
  badge?: string;
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-[#F5F6F8]">
        <div className="flex items-center gap-2 mb-3">
          {badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EBF3FE] text-[#3182F6]">
              {badge}
            </span>
          )}
          <p className="text-xs font-semibold text-[#8B95A1] uppercase tracking-widest">{title}</p>
        </div>
        <p className="text-sm text-[#191F28] leading-relaxed">{summary}</p>
      </div>

      {keyThemes.length > 0 && (
        <div className="px-5 py-4 border-b border-[#F5F6F8]">
          <p className="text-xs font-semibold text-[#8B95A1] mb-3">핵심 테마</p>
          <div className="flex flex-wrap gap-2">
            {keyThemes.map((theme, i) => (
              <span key={i} className="px-3 py-1 bg-[#F5F6F8] rounded-full text-xs text-[#191F28] font-medium">
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {headlines.length > 0 && (
        <div className="divide-y divide-[#F5F6F8]">
          {headlines.map((h, i) => (
            <a
              key={i}
              href={h.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-5 py-4 hover:bg-[#F5F6F8] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#191F28] leading-snug mb-1">{h.title}</p>
                  <p className="text-xs text-[#3182F6] leading-relaxed">{h.insight}</p>
                </div>
                <svg className="flex-none w-4 h-4 text-[#B0B8C1] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-xs text-[#B0B8C1] mt-1.5">{h.source}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const fetchDigest = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = forceRefresh ? '/api/news?refresh=true' : '/api/news';
      const res = await fetch(url);
      const data: DigestResponse = await res.json();
      if (!res.ok) throw new Error(data.error || '오류가 발생했습니다');
      setDigest(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  const hour = now.getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '좋은 오후예요' : '좋은 저녁이에요';

  return (
    <div className="max-w-md mx-auto min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F5F6F8]/90 backdrop-blur-sm px-5 pt-5 pb-3">
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
          <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
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
      </header>

      {/* Body */}
      <main className="px-5 pb-12 space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">
            {error}
          </div>
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
            {/* 날짜 + 캐시 뱃지 */}
            <div className="flex items-center gap-2 text-xs text-[#8B95A1] pt-1">
              <span>{digest.date}</span>
              {digest.cached && (
                <span className="bg-gray-100 text-[#8B95A1] px-2 py-0.5 rounded-full">캐시됨</span>
              )}
            </div>

            {/* 전체 탭 */}
            {activeTab === 'all' && (
              <>
                <InsightsCard insights={digest.investmentInsights} />
                <SectionCard
                  title="국내 경제 요약"
                  badge="국내"
                  summary={digest.korean.summary}
                  keyThemes={digest.korean.keyThemes}
                  headlines={digest.korean.headlines}
                />
                <SectionCard
                  title="글로벌 경제 요약"
                  badge="해외"
                  summary={digest.global.summary}
                  keyThemes={digest.global.keyThemes}
                  headlines={digest.global.headlines}
                />
              </>
            )}

            {/* 국내 탭 */}
            {activeTab === 'korean' && (
              <SectionCard
                title="국내 경제"
                badge="국내"
                summary={digest.korean.summary}
                keyThemes={digest.korean.keyThemes}
                headlines={digest.korean.headlines}
              />
            )}

            {/* 해외 탭 */}
            {activeTab === 'global' && (
              <SectionCard
                title="글로벌 경제"
                badge="해외"
                summary={digest.global.summary}
                keyThemes={digest.global.keyThemes}
                headlines={digest.global.headlines}
              />
            )}

            <p className="text-center text-xs text-[#B0B8C1] pt-2">
              매일 오전 8시 자동 업데이트
            </p>
          </>
        )}
      </main>
    </div>
  );
}
