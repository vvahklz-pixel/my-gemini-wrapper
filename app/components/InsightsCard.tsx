import type { HeadlineItem } from '@/lib/gemini';

export default function InsightsCard({
  insights,
  koreanHeadlines = [],
  globalHeadlines = [],
}: {
  insights: unknown;
  koreanHeadlines?: HeadlineItem[];
  globalHeadlines?: HeadlineItem[];
}) {
  function toStr(item: unknown): string {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') return Object.values(item as Record<string, unknown>).join(' ');
    return String(item ?? '');
  }

  const safeInsights: string[] = Array.isArray(insights)
    ? insights.map(toStr).filter(Boolean)
    : typeof insights === 'string'
    ? insights.split('\n').filter(Boolean)
    : insights && typeof insights === 'object'
    ? Object.values(insights as Record<string, unknown>).map(toStr).filter(Boolean)
    : [];

  // 근거 기사: 국내 2개 + 글로벌 2개
  const sourceHeadlines = [
    ...koreanHeadlines.slice(0, 2).map((h) => ({ ...h, tag: '국내' })),
    ...globalHeadlines.slice(0, 2).map((h) => ({ ...h, tag: '글로벌' })),
  ];

  return (
    <div className="bg-[#3182F6] rounded-2xl overflow-hidden">
      <div className="p-5">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">오늘의 투자 인사이트</p>
        <ol className="space-y-3">
          {safeInsights.map((insight, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/90">
              <span className="flex-none w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span>{insight}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* 근거 기사 */}
      {sourceHeadlines.length > 0 && (
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3">분석 근거 기사</p>
          <ul className="space-y-2.5">
            {sourceHeadlines.map((h, i) => (
              <li key={i}>
                <a
                  href={h.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 group"
                >
                  <span className="flex-none mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/15 text-white/70">
                    {h.tag}
                  </span>
                  <span className="text-xs text-white/70 leading-snug group-hover:text-white transition-colors">
                    {h.title}
                    <span className="text-white/40 ml-1">— {h.source}</span>
                  </span>
                  <svg className="flex-none w-3 h-3 text-white/30 mt-0.5 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
