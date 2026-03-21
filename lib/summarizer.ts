import Groq from 'groq-sdk';
import type { NewsItem } from './news-fetcher';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface CategoryBriefing {
  id: string;
  label: string;
  summary: string;
  keyPoints: string[];
}

export interface NewsBriefing {
  date: string;
  summary: string;
  keyPoints: string[];
  marketOutlook: string;
  rawNewsCount: number;
  categories: CategoryBriefing[];
  sourceCount: { domestic: number; global: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  domestic: '국내경제',
  global: '해외경제',
  markets: '주식/투자',
  macro: '거시/금리',
};

export async function summarizeNews(news: NewsItem[]): Promise<NewsBriefing> {
  const newsText = news
    .slice(0, 60)
    .map((n) => `[${n.category}][${n.source}] ${n.title}${n.summary ? ' - ' + n.summary : ''}`)
    .join('\n');

  const today = new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `오늘(${today}) 수집된 경제 뉴스를 투자자 관점에서 분석해주세요.

카테고리: domestic=국내경제, global=해외경제, markets=주식/투자, macro=거시/금리환율

다음 형식으로 JSON 응답해주세요:
{
  "summary": "전체 경제 상황 종합 요약 (3-4문장, 오늘 가장 중요한 흐름)",
  "keyPoints": [
    "핵심 포인트 1 (투자에 영향을 줄 수 있는 사안)",
    "핵심 포인트 2",
    "핵심 포인트 3",
    "핵심 포인트 4",
    "핵심 포인트 5"
  ],
  "marketOutlook": "오늘의 시장 전망 및 주목해야 할 섹터/자산 (2-3문장)",
  "categories": [
    {
      "id": "domestic",
      "label": "국내경제",
      "summary": "국내 경제 핵심 요약 (2문장)",
      "keyPoints": ["국내 주요 이슈 1", "국내 주요 이슈 2", "국내 주요 이슈 3"]
    },
    {
      "id": "global",
      "label": "해외경제",
      "summary": "글로벌 경제 핵심 요약 (2문장)",
      "keyPoints": ["글로벌 주요 이슈 1", "글로벌 주요 이슈 2", "글로벌 주요 이슈 3"]
    },
    {
      "id": "markets",
      "label": "주식/투자",
      "summary": "주식/투자 시장 핵심 요약 (2문장)",
      "keyPoints": ["시장 주요 이슈 1", "시장 주요 이슈 2", "시장 주요 이슈 3"]
    },
    {
      "id": "macro",
      "label": "거시/금리",
      "summary": "거시경제/금리/환율 핵심 요약 (2문장)",
      "keyPoints": ["거시 주요 이슈 1", "거시 주요 이슈 2", "거시 주요 이슈 3"]
    }
  ]
}

수집된 뉴스:
${newsText}

반드시 유효한 JSON만 반환하세요.`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Groq response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const domesticCount = news.filter((n) => n.category === 'domestic' || n.category === 'macro').length;
  const globalCount = news.filter((n) => n.category === 'global' || n.category === 'markets').length;

  return {
    date: today,
    summary: parsed.summary || '',
    keyPoints: parsed.keyPoints || [],
    marketOutlook: parsed.marketOutlook || '',
    rawNewsCount: news.length,
    categories: parsed.categories || Object.entries(CATEGORY_LABELS).map(([id, label]) => ({
      id, label, summary: '', keyPoints: [],
    })),
    sourceCount: { domestic: domesticCount, global: globalCount },
  };
}
