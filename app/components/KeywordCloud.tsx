'use client';

import { useState } from 'react';
import type { HeadlineItem, NewsItem } from '@/lib/gemini';

export default function KeywordCloud({
  koreanKeywords,
  globalKeywords,
  koreanHeadlines = [],
  globalHeadlines = [],
  koreanRawItems = [],
  globalRawItems = [],
}: {
  koreanKeywords: string[];
  globalKeywords: string[];
  koreanHeadlines?: HeadlineItem[];
  globalHeadlines?: HeadlineItem[];
  koreanRawItems?: NewsItem[];
  globalRawItems?: NewsItem[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const matchHeadlines = (kw: string, headlines: HeadlineItem[]) => {
    const q = kw.toLowerCase();
    return headlines.filter(
      (h) =>
        h.title.toLowerCase().includes(q) ||
        h.insight.toLowerCase().includes(q) ||
        h.source.toLowerCase().includes(q)
    );
  };

  // rawItems 중 headlines에 이미 포함된 링크는 제외(중복 방지)
  const matchRawItems = (kw: string, rawItems: NewsItem[], headlines: HeadlineItem[]) => {
    const q = kw.toLowerCase();
    const headlineLinks = new Set(headlines.map((h) => h.link));
    return rawItems.filter(
      (item) =>
        !headlineLinks.has(item.link) &&
        (item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q))
    );
  };

  const koreanSet = new Set(koreanKeywords.map((k) => k.toLowerCase()));
  const globalSet = new Set(globalKeywords.map((k) => k.toLowerCase()));
  const overlap = new Set([...koreanSet].filter((k) => globalSet.has(k)));

  const sizeCls = (idx: number) => {
    if (idx < 3) return 'text-base font-bold px-4 py-2';
    if (idx < 7) return 'text-sm font-semibold px-3 py-1.5';
    return 'text-xs font-medium px-3 py-1';
  };

  const bgCls = (keyword: string, idx: number, set: 'korean' | 'global') => {
    const isOverlap = overlap.has(keyword.toLowerCase());
    const isSelected = selected === keyword;
    if (isSelected) return 'bg-[#191F28] text-white';
    if (isOverlap) return 'bg-[#3182F6] text-white';
    if (idx < 3) return set === 'korean' ? 'bg-[#EBF3FE] text-[#3182F6]' : 'bg-[#E8F8F0] text-[#0E8040]';
    return 'bg-[#F5F6F8] text-[#191F28] hover:bg-[#E5E8EB]';
  };

  const hasKeywords = koreanKeywords.length > 0 || globalKeywords.length > 0;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="bg-white rounded-2xl p-4">
        <p className="text-xs font-semibold text-[#8B95A1] mb-3">범례</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#3182F6] inline-block" />
            <span className="text-[#8B95A1]">국내·글로벌 공통 키워드</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#EBF3FE] border border-[#3182F6]/30 inline-block" />
            <span className="text-[#8B95A1]">국내 주요 키워드</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E8F8F0] border border-[#0E8040]/30 inline-block" />
            <span className="text-[#8B95A1]">글로벌 주요 키워드</span>
          </span>
        </div>
      </div>

      {/* Korean keywords */}
      {koreanKeywords.length > 0 && (
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EBF3FE] text-[#3182F6]">국내</span>
            <p className="text-xs font-semibold text-[#8B95A1] uppercase tracking-widest">국내 경제 키워드</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {koreanKeywords.map((kw, i) => (
              <button
                key={kw}
                onClick={() => setSelected(selected === kw ? null : kw)}
                className={`rounded-full transition-all ${sizeCls(i)} ${bgCls(kw, i, 'korean')}`}
              >
                {overlap.has(kw.toLowerCase()) && <span className="mr-1 opacity-70">⚡</span>}
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global keywords */}
      {globalKeywords.length > 0 && (
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F8F0] text-[#0E8040]">해외</span>
            <p className="text-xs font-semibold text-[#8B95A1] uppercase tracking-widest">글로벌 경제 키워드</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {globalKeywords.map((kw, i) => (
              <button
                key={kw}
                onClick={() => setSelected(selected === kw ? null : kw)}
                className={`rounded-full transition-all ${sizeCls(i)} ${bgCls(kw, i, 'global')}`}
              >
                {overlap.has(kw.toLowerCase()) && <span className="mr-1 opacity-70">⚡</span>}
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected keyword — related news */}
      {selected && (() => {
        const relatedKorean = matchHeadlines(selected, koreanHeadlines);
        const relatedGlobal = matchHeadlines(selected, globalHeadlines);
        const relatedKoreanRaw = matchRawItems(selected, koreanRawItems, koreanHeadlines);
        const relatedGlobalRaw = matchRawItems(selected, globalRawItems, globalHeadlines);
        const hasNews =
          relatedKorean.length > 0 || relatedGlobal.length > 0 ||
          relatedKoreanRaw.length > 0 || relatedGlobalRaw.length > 0;
        return (
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#191F28] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs mb-0.5">키워드 관련 뉴스</p>
                <p className="text-white font-bold text-base">{selected}</p>
                {overlap.has(selected.toLowerCase()) && (
                  <p className="text-[#3182F6] text-xs mt-1">⚡ 국내·글로벌 공통 핵심 키워드</p>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* News list */}
            {!hasNews && (
              <p className="text-center text-[#B0B8C1] text-sm py-8">
                이 키워드와 직접 연관된 헤드라인이 없습니다.
              </p>
            )}

            {relatedKorean.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#8B95A1] px-5 pt-4 pb-2 uppercase tracking-widest">국내</p>
                <div className="divide-y divide-[#F5F6F8]">
                  {relatedKorean.map((h, i) => (
                    <a
                      key={i}
                      href={h.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-5 py-4 hover:bg-[#F5F6F8] transition-colors"
                    >
                      {h.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={h.imageUrl}
                          alt=""
                          className="flex-none w-14 h-14 rounded-xl object-cover bg-[#F5F6F8]"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#191F28] leading-snug mb-1">{h.title}</p>
                        <p className="text-xs text-[#3182F6] leading-relaxed">{h.insight}</p>
                        <p className="text-xs text-[#B0B8C1] mt-1.5">{h.source}</p>
                      </div>
                      <svg className="flex-none w-4 h-4 text-[#B0B8C1] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {relatedGlobal.length > 0 && (
              <div className={relatedKorean.length > 0 ? 'border-t border-[#F5F6F8]' : ''}>
                <p className="text-xs font-semibold text-[#8B95A1] px-5 pt-4 pb-2 uppercase tracking-widest">글로벌</p>
                <div className="divide-y divide-[#F5F6F8]">
                  {relatedGlobal.map((h, i) => (
                    <a
                      key={i}
                      href={h.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-5 py-4 hover:bg-[#F5F6F8] transition-colors"
                    >
                      {h.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={h.imageUrl}
                          alt=""
                          className="flex-none w-14 h-14 rounded-xl object-cover bg-[#F5F6F8]"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#191F28] leading-snug mb-1">{h.title}</p>
                        <p className="text-xs text-[#3182F6] leading-relaxed">{h.insight}</p>
                        <p className="text-xs text-[#B0B8C1] mt-1.5">{h.source}</p>
                      </div>
                      <svg className="flex-none w-4 h-4 text-[#B0B8C1] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {relatedKoreanRaw.length > 0 && (
              <div className="border-t border-[#F5F6F8]">
                <p className="text-xs font-semibold text-[#8B95A1] px-5 pt-4 pb-2 uppercase tracking-widest">국내 — 추가 기사</p>
                <div className="divide-y divide-[#F5F6F8]">
                  {relatedKoreanRaw.map((item, i) => (
                    <a
                      key={i}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-5 py-4 hover:bg-[#F5F6F8] transition-colors"
                    >
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="flex-none w-14 h-14 rounded-xl object-cover bg-[#F5F6F8]"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#191F28] leading-snug mb-1">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-[#8B95A1] leading-relaxed line-clamp-2">{item.description}</p>
                        )}
                        <p className="text-xs text-[#B0B8C1] mt-1.5">{item.source}</p>
                      </div>
                      <svg className="flex-none w-4 h-4 text-[#B0B8C1] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {relatedGlobalRaw.length > 0 && (
              <div className="border-t border-[#F5F6F8]">
                <p className="text-xs font-semibold text-[#8B95A1] px-5 pt-4 pb-2 uppercase tracking-widest">글로벌 — 추가 기사</p>
                <div className="divide-y divide-[#F5F6F8]">
                  {relatedGlobalRaw.map((item, i) => (
                    <a
                      key={i}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-5 py-4 hover:bg-[#F5F6F8] transition-colors"
                    >
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="flex-none w-14 h-14 rounded-xl object-cover bg-[#F5F6F8]"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#191F28] leading-snug mb-1">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-[#8B95A1] leading-relaxed line-clamp-2">{item.description}</p>
                        )}
                        <p className="text-xs text-[#B0B8C1] mt-1.5">{item.source}</p>
                      </div>
                      <svg className="flex-none w-4 h-4 text-[#B0B8C1] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {!hasKeywords && (
        <div className="bg-white rounded-2xl p-8 text-center text-[#B0B8C1] text-sm">
          키워드 데이터가 없습니다. 뉴스를 새로고침 해주세요.
        </div>
      )}
    </div>
  );
}
