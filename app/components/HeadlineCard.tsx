'use client';

import { useRef, useState } from 'react';
import type { HeadlineItem } from '@/lib/gemini';

const SIGNAL_STYLE = {
  '매수우세': { badge: 'bg-[#E8F8F0] text-[#0E8040]', dot: 'bg-[#0E8040]', label: 'text-[#0E8040]' },
  '중립':    { badge: 'bg-[#F5F6F8] text-[#8B95A1]', dot: 'bg-[#8B95A1]', label: 'text-[#8B95A1]' },
  '매도우세': { badge: 'bg-[#FFF0F0] text-[#F04452]', dot: 'bg-[#F04452]', label: 'text-[#F04452]' },
} as const;

const RISK_STYLE = {
  HIGH: { badge: 'bg-[#FFF0F0] text-[#F04452]' },
  MED:  { badge: 'bg-[#FFF8E6] text-[#E08A00]' },
  LOW:  { badge: 'bg-[#E8F8F0] text-[#0E8040]' },
} as const;

export default function HeadlineCard({ h }: { h: HeadlineItem }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sig = SIGNAL_STYLE[h.signal] ?? SIGNAL_STYLE['중립'];
  const risk = RISK_STYLE[h.riskLevel] ?? RISK_STYLE['MED'];
  const hasFactors = h.signalFactors && h.signalFactors.length > 0;

  function handleMouseEnter() {
    if (!hasFactors) return;
    timerRef.current = setTimeout(() => setVisible(true), 600);
  }

  function handleMouseLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <a
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
            className="flex-none w-16 h-16 rounded-xl object-cover bg-[#F5F6F8]"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#191F28] leading-snug mb-1">{h.title}</p>
          <p className="text-xs text-[#3182F6] leading-relaxed">{h.insight}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <p className="text-xs text-[#B0B8C1]">{h.source}</p>
            {h.signal && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${sig.badge}`}>
                {h.signal}
              </span>
            )}
            {h.riskLevel && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${risk.badge}`}>
                {h.riskLevel}
              </span>
            )}
            {hasFactors && (
              <span className="text-[10px] text-[#B0B8C1]">· 판단근거</span>
            )}
          </div>
        </div>
        <svg className="flex-none w-4 h-4 text-[#B0B8C1] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>

      {visible && hasFactors && (
        <div className="absolute left-5 right-5 bottom-full mb-2 z-20 pointer-events-none">
          <div className="bg-[#191F28] rounded-xl px-4 py-3 shadow-xl">
            <p className={`text-[10px] font-bold mb-2 ${sig.label}`}>
              {h.signal} 판단 근거
            </p>
            <ul className="space-y-1.5">
              {h.signalFactors!.map((factor, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#E5E8EB] leading-snug">
                  <span className={`flex-none w-1.5 h-1.5 rounded-full mt-1 ${sig.dot}`} />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
