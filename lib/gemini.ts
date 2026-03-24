import Groq from 'groq-sdk';
import { jsonrepair } from 'jsonrepair';
import type { NewsItem } from './rss';

export type { NewsItem };

export interface HeadlineItem {
  title: string;
  source: string;
  link: string;
  insight: string;
  signal: '매수우세' | '중립' | '매도우세';
  riskLevel: 'HIGH' | 'MED' | 'LOW';
  signalFactors?: string[];
  imageUrl?: string;
}

export interface DigestSection {
  summary: string;
  macroView: string;
  realEstateView?: string;
  techView: string;
  signal: '매수우세' | '중립' | '매도우세';
  signalReason: string;
  riskLevel: 'HIGH' | 'MED' | 'LOW';
  keyThemes: string[];
  headlines: HeadlineItem[];
  keywords: string[];
  rawItems?: NewsItem[];
}

export interface Digest {
  date: string;
  generatedAt: string;
  korean: DigestSection;
  global: DigestSection;
  investmentInsights: string[];
}

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.1-8b-instant';

function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) return text.slice(firstBrace, lastBrace + 1);
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1) return text.slice(firstBracket, lastBracket + 1);
  return text.trim();
}

function jaccard(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wb = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / (wa.size + wb.size - inter);
}

function dedup(items: NewsItem[]): NewsItem[] {
  const result: NewsItem[] = [];
  for (const item of items) {
    if (!result.some((r) => jaccard(r.title, item.title) >= 0.8)) result.push(item);
  }
  return result;
}

interface LLMHeadline {
  idx: number;
  insight: string;
  signal: '매수우세' | '중립' | '매도우세';
  riskLevel: 'HIGH' | 'MED' | 'LOW';
}

function mapHeadlines(raw: LLMHeadline[], items: NewsItem[]): HeadlineItem[] {
  return (raw ?? [])
    .filter((h) => typeof h.idx === 'number' && h.idx >= 0 && h.idx < items.length)
    .map((h) => ({
      title: items[h.idx].title,
      source: items[h.idx].source,
      link: items[h.idx].link,
      imageUrl: items[h.idx].imageUrl,
      insight: h.insight ?? '',
      signal: h.signal ?? '중립',
      riskLevel: h.riskLevel ?? 'MED',
    }));
}

// placeholder 패턴 — LLM이 지시문을 그대로 출력한 경우 탐지
const PLACEHOLDER_RE = [
  /^[^\s]{0,10}\d+문장$/,          // "요약 3문장", "2문장"
  /^테마\d+$/,                      // "테마1", "테마2"
  /^키워드\d+개?$/,                  // "키워드8개", "키워드1"
  /^\d+개$/,                        // "8개"
  /^실적·섹터 기회.{0,10}\d문장$/,  // 지시문 그대로
  /^투자영향 \d줄$/,                 // "투자영향 1줄"
  /^근거 한 줄$/,
];

function isPlaceholder(s: string): boolean {
  const t = s.trim();
  return !t || PLACEHOLDER_RE.some((r) => r.test(t));
}

function sanitizeSection(raw: Partial<DigestSection> & { headlines?: LLMHeadline[] }): Partial<DigestSection> & { headlines?: LLMHeadline[] } {
  return {
    ...raw,
    summary: isPlaceholder(raw.summary ?? '') ? '' : raw.summary,
    macroView: isPlaceholder(raw.macroView ?? '') ? '' : raw.macroView,
    techView: isPlaceholder(raw.techView ?? '') ? '' : raw.techView,
    realEstateView: raw.realEstateView && isPlaceholder(raw.realEstateView) ? undefined : raw.realEstateView,
    signalReason: isPlaceholder(raw.signalReason ?? '') ? '' : raw.signalReason,
    keyThemes: (raw.keyThemes ?? []).filter((t) => !isPlaceholder(t)),
    keywords: (raw.keywords ?? []).filter((k) => !isPlaceholder(k)),
  };
}

function buildList(items: NewsItem[]): string {
  return items.map((i, n) => `[${n}] ${i.source} | ${i.title} | ${i.description.slice(0, 80)}`).join('\n');
}

const SECTION_SCHEMA = `{
  "summary": "<오늘 뉴스 전체 흐름 3문장>",
  "macroView": "<금리·환율·경기 실제 영향 2문장>",
  "techView": "<실적·섹터 실제 기회와 리스크 2문장>",
  "realEstateView": "<부동산·금리 정책 실제 영향 1문장, 해당 없으면 null>",
  "signal": "매수우세 또는 중립 또는 매도우세",
  "signalReason": "<시그널 근거 한 줄>",
  "riskLevel": "HIGH 또는 MED 또는 LOW",
  "keyThemes": ["<실제테마명>", "<실제테마명>", "<실제테마명>"],
  "keywords": ["<실제키워드>", "<실제키워드>", "<실제키워드>", "<실제키워드>", "<실제키워드>", "<실제키워드>", "<실제키워드>", "<실제키워드>"],
  "headlines": [{"idx": 0, "insight": "<투자 영향 1줄>", "signal": "매수우세 또는 중립 또는 매도우세", "riskLevel": "HIGH 또는 MED 또는 LOW"}]
}`;

function buildKoreanPrompt(items: NewsItem[]): string {
  return `한국 경제 뉴스를 분석하고 아래 JSON 형식으로만 반환하라. 마크다운 금지.\n\n${buildList(items)}\n\n${SECTION_SCHEMA}\n\n주의: "테마1", "키워드8개" 같은 예시 텍스트 금지 — 반드시 실제 분석 내용. headlines는 중요 뉴스 5개, idx는 위 목록 번호.`;
}

function buildGlobalPrompt(items: NewsItem[]): string {
  return `Analyze global economic news for Korean investors. Return only the JSON below. No markdown. All values in Korean.\n\n${buildList(items)}\n\n${SECTION_SCHEMA}\n\n주의: "테마1", "키워드8개" 같은 예시 텍스트 금지 — 반드시 실제 분석 내용. headlines는 5 most important, idx from list above.`;
}

function buildInsightPrompt(korean: DigestSection, global: DigestSection): string {
  return `[국내 경제]
매크로: ${korean.macroView}
테크: ${korean.techView}
시그널: ${korean.signal} — ${korean.signalReason}
테마: ${korean.keyThemes.join(', ')}

[글로벌 경제]
매크로: ${global.macroView}
테크: ${global.techView}
시그널: ${global.signal} — ${global.signalReason}
테마: ${global.keyThemes.join(', ')}

위 국내+글로벌 분석을 바탕으로 한국 투자자 인사이트 JSON 배열만 반환.
조건:
- 총 6~8개. [국내] 태그 3개 이상 + [글로벌] 태그 3개 이상
- 각 항목 형식: "[국내] 무엇이 → 어떻게 → 투자 영향 1~2문장"
- 수치·기업명이 있으면 반드시 포함. "영향이 있다" 같은 추상 표현 금지
- 나쁜 예: "[국내] 금리 정책이 시장에 영향을 줄 수 있다"
- 좋은 예: "[국내] 한국은행 기준금리 동결로 원화 약세 지속 → 삼성전자·현대차 환차익 기대, 수입 물가 상승 압력"`;
}

async function callGroq(prompt: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: '경제/금융 애널리스트. 반드시 순수 JSON만 반환. 마크다운 코드블록(```) 사용 금지. 설명 텍스트 없이 JSON 객체만 출력.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1600,
  });
  return completion.choices[0]?.message?.content ?? '';
}

export async function generateDigest(
  koreanItems: NewsItem[],
  globalItems: NewsItem[]
): Promise<Digest> {
  const koreanDeduped = dedup(koreanItems).slice(0, 30);
  const globalDeduped = dedup(globalItems).slice(0, 30);

  const [koreanText, globalText] = await Promise.all([
    callGroq(buildKoreanPrompt(koreanDeduped)),
    callGroq(buildGlobalPrompt(globalDeduped)),
  ]);

  const koreanRaw = sanitizeSection(JSON.parse(jsonrepair(extractJson(koreanText))));
  const globalRaw = sanitizeSection(JSON.parse(jsonrepair(extractJson(globalText))));

  const korean: DigestSection = {
    ...koreanRaw,
    summary: koreanRaw.summary ?? '',
    keywords: koreanRaw.keywords ?? [],
    macroView: koreanRaw.macroView ?? '',
    techView: koreanRaw.techView ?? '',
    keyThemes: koreanRaw.keyThemes ?? [],
    signal: (koreanRaw.signal as DigestSection['signal']) ?? '중립',
    signalReason: koreanRaw.signalReason ?? '',
    riskLevel: (koreanRaw.riskLevel as DigestSection['riskLevel']) ?? 'MED',
    headlines: mapHeadlines(koreanRaw.headlines ?? [], koreanDeduped),
  };
  const global: DigestSection = {
    ...globalRaw,
    summary: globalRaw.summary ?? '',
    keywords: globalRaw.keywords ?? [],
    macroView: globalRaw.macroView ?? '',
    techView: globalRaw.techView ?? '',
    keyThemes: globalRaw.keyThemes ?? [],
    signal: (globalRaw.signal as DigestSection['signal']) ?? '중립',
    signalReason: globalRaw.signalReason ?? '',
    riskLevel: (globalRaw.riskLevel as DigestSection['riskLevel']) ?? 'MED',
    headlines: mapHeadlines(globalRaw.headlines ?? [], globalDeduped),
  };

  const insightText = await callGroq(buildInsightPrompt(korean, global));
  let investmentInsights: string[] = [];
  try {
    const parsed = JSON.parse(jsonrepair(extractJson(insightText)));
    investmentInsights = Array.isArray(parsed)
      ? parsed.map((item) =>
          typeof item === 'string'
            ? item
            : item && typeof item === 'object'
            ? Object.values(item as Record<string, unknown>).join(' ')
            : String(item)
        )
      : [];
  } catch {
    investmentInsights = [];
  }

  const now = new Date();
  return {
    date: now.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
    generatedAt: now.toISOString(),
    korean,
    global,
    investmentInsights,
  };
}
