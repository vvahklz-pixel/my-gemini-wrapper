'use client';

import { useState } from 'react';
import type { HeadlineItem, DigestSection } from '@/lib/gemini';
import HeadlineCard from './HeadlineCard';

const SIGNAL_STYLE = {
  '매수우세': { bg: 'bg-[#E8F8F0]', text: 'text-[#0E8040]', dot: 'bg-[#0E8040]', badge: 'bg-[#E8F8F0] text-[#0E8040]' },
  '중립':    { bg: 'bg-[#F5F6F8]', text: 'text-[#8B95A1]', dot: 'bg-[#8B95A1]', badge: 'bg-[#F5F6F8] text-[#8B95A1]' },
  '매도우세': { bg: 'bg-[#FFF0F0]', text: 'text-[#F04452]', dot: 'bg-[#F04452]', badge: 'bg-[#FFF0F0] text-[#F04452]' },
} as const;

const RISK_STYLE = {
  HIGH: { bg: 'bg-[#FFF0F0]', text: 'text-[#F04452]', badge: 'bg-[#FFF0F0] text-[#F04452]' },
  MED:  { bg: 'bg-[#FFF8E6]', text: 'text-[#E08A00]', badge: 'bg-[#FFF8E6] text-[#E08A00]' },
  LOW:  { bg: 'bg-[#E8F8F0]', text: 'text-[#0E8040]', badge: 'bg-[#E8F8F0] text-[#0E8040]' },
} as const;

export default function SectionCard({
  title,
  badge,
  summary,
  macroView,
  realEstateView,
  techView,
  signal,
  signalReason,
  riskLevel,
  keyThemes,
  headlines,
}: {
  title: string;
  badge?: string;
  summary: DigestSection['summary'];
  macroView: DigestSection['macroView'];
  realEstateView?: DigestSection['realEstateView'];
  techView: DigestSection['techView'];
  signal: DigestSection['signal'];
  signalReason: DigestSection['signalReason'];
  riskLevel: DigestSection['riskLevel'];
  keyThemes: DigestSection['keyThemes'];
  headlines: HeadlineItem[];
}) {
  const [signalOpen, setSignalOpen] = useState(false);
  const sig = SIGNAL_STYLE[signal] ?? SIGNAL_STYLE['중립'];
  const risk = RISK_STYLE[riskLevel] ?? RISK_STYLE['MED'];

  const signalDetails = [macroView, techView, realEstateView].filter(Boolean) as string[];

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      {/* Header */}
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

      {/* Signal + Risk — 클릭 시 근거 토글 */}
      <div className="flex gap-2 px-5 py-3 border-b border-[#F5F6F8]">
        <button
          onClick={() => setSignalOpen((v) => !v)}
          className={`flex-1 rounded-xl px-3 py-2.5 text-left transition-colors ${sig.bg} ${signalDetails.length > 0 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${sig.dot}`} />
              <p className={`text-xs font-bold ${sig.text}`}>{signal}</p>
            </div>
            {signalDetails.length > 0 && (
              <svg
                className={`w-3.5 h-3.5 ${sig.text} opacity-60 transition-transform ${signalOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
          {signalReason && (
            <p className={`text-xs leading-relaxed mt-0.5 ${sig.text} opacity-80`}>{signalReason}</p>
          )}
          {signalOpen && signalDetails.length > 0 && (
            <ul className={`mt-2 pt-2 border-t border-current border-opacity-10 space-y-1.5`}>
              {signalDetails.map((d, i) => (
                <li key={i} className={`text-xs leading-relaxed ${sig.text} opacity-70 flex gap-1.5`}>
                  <span className="flex-none mt-1 w-1 h-1 rounded-full bg-current opacity-50" />
                  {d}
                </li>
              ))}
            </ul>
          )}
        </button>
        <div className={`flex items-center gap-1.5 rounded-xl px-4 ${risk.bg}`}>
          <p className={`text-xs font-bold ${risk.text}`}>리스크</p>
          <p className={`text-sm font-black ${risk.text}`}>{riskLevel}</p>
        </div>
      </div>

      {/* Analysis */}
      <div className="px-5 py-4 border-b border-[#F5F6F8] space-y-3">
        {macroView && (
          <div>
            <p className="text-[10px] font-bold text-[#8B95A1] uppercase tracking-widest mb-1">매크로경제</p>
            <p className="text-xs text-[#191F28] leading-relaxed">{macroView}</p>
          </div>
        )}
        {realEstateView && (
          <div>
            <p className="text-[10px] font-bold text-[#8B95A1] uppercase tracking-widest mb-1">부동산</p>
            <p className="text-xs text-[#191F28] leading-relaxed">{realEstateView}</p>
          </div>
        )}
        {techView && (
          <div>
            <p className="text-[10px] font-bold text-[#8B95A1] uppercase tracking-widest mb-1">테크·투자</p>
            <p className="text-xs text-[#191F28] leading-relaxed">{techView}</p>
          </div>
        )}
      </div>

      {/* Key themes */}
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

      {/* Headlines */}
      {headlines.length > 0 && (
        <div className="divide-y divide-[#F5F6F8]">
          {headlines.map((h, i) => (
            <HeadlineCard key={i} h={h} />
          ))}
        </div>
      )}
    </div>
  );
}
