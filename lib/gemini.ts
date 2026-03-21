import Groq from 'groq-sdk';
import type { NewsItem } from './rss';

export interface HeadlineItem {
  title: string;
  source: string;
  link: string;
  insight: string;
}

export interface DigestSection {
  summary: string;
  keyThemes: string[];
  headlines: HeadlineItem[];
}

export interface Digest {
  date: string;
  generatedAt: string;
  korean: DigestSection;
  global: DigestSection;
  investmentInsights: string[];
}

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

function buildKoreanPrompt(items: NewsItem[]): string {
  const list = items
    .slice(0, 30)
    .map((i, n) => `[${n}] 출처: ${i.source}\n    제목: ${i.title}\n    링크: ${i.link}\n    내용: ${i.description}`)
    .join('\n\n');

  return `다음은 오늘의 한국 주요 경제 뉴스입니다:\n\n${list}\n\n위 뉴스를 투자자 관점에서 분석하여 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):\n{\n  "summary": "전체 한국 경제 상황 요약 (투자 관점, 3-4문장, 주가/환율/금리/부동산 등 언급)",\n  "keyThemes": ["핵심 테마 1", "핵심 테마 2", "핵심 테마 3", "핵심 테마 4"],\n  "headlines": [\n    {\n      "title": "뉴스 제목 (위 목록에서 그대로 가져오거나 약간 요약)",\n      "source": "출처명",\n      "link": "위 목록의 실제 링크 URL 그대로",\n      "insight": "이 뉴스가 투자에 미치는 영향 1줄 (구체적으로)"\n    }\n  ]\n}\n\n가장 투자에 중요한 뉴스 7개를 선택하세요. 링크는 반드시 위 목록에서 실제 URL을 그대로 사용하세요.`;
}

function buildGlobalPrompt(items: NewsItem[]): string {
  const list = items
    .slice(0, 30)
    .map((i, n) => `[${n}] Source: ${i.source}\n    Title: ${i.title}\n    Link: ${i.link}\n    Summary: ${i.description}`)
    .join('\n\n');

  return `Here are today's major global economic and financial news:\n\n${list}\n\nAnalyze these for a Korean investor and respond ONLY in this JSON format (no other text):\n{\n  "summary": "글로벌 경제 상황 전체 요약 (한국어, 투자 관점, 3-4문장, 미국 증시/달러/금리/원자재 등 언급)",\n  "keyThemes": ["핵심 테마 1", "핵심 테마 2", "핵심 테마 3", "핵심 테마 4"],\n  "headlines": [\n    {\n      "title": "뉴스 제목 (한국어 번역, 핵심만 간결하게)",\n      "source": "Source name from list above",\n      "link": "Actual URL from list above (copy exactly)",\n      "insight": "이 뉴스가 한국 투자에 미치는 영향 1줄 (한국어, 구체적으로)"\n    }\n  ]\n}\n\nSelect the 7 most important headlines for investors. Use the EXACT links from the list above.`;
}

function buildInsightPrompt(korean: DigestSection, global: DigestSection): string {
  return `한국 경제 요약:\n${korean.summary}\n\n글로벌 경제 요약:\n${global.summary}\n\n한국 핵심 테마: ${korean.keyThemes.join(', ')}\n글로벌 핵심 테마: ${global.keyThemes.join(', ')}\n\n위 내용을 종합하여 오늘 투자자가 반드시 알아야 할 핵심 인사이트를 JSON 배열로만 응답하세요 (다른 텍스트 없이):\n["인사이트 1 (구체적 행동 지침 포함)", "인사이트 2", "인사이트 3", "인사이트 4", "인사이트 5"]\n\n각 인사이트는 "~이므로 ~에 주목하라" 형식으로 실행 가능한 내용으로 작성하세요.`;
}

async function callGroq(prompt: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: '당신은 15년 경력의 전문 경제/금융 애널리스트입니다. 투자자를 위한 아침 브리핑을 작성합니다. 반드시 요청한 JSON 형식으로만 응답하세요.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 2000,
  });
  return completion.choices[0]?.message?.content ?? '';
}

export async function generateDigest(
  koreanItems: NewsItem[],
  globalItems: NewsItem[]
): Promise<Digest> {
  const [koreanText, globalText] = await Promise.all([
    callGroq(buildKoreanPrompt(koreanItems)),
    callGroq(buildGlobalPrompt(globalItems)),
  ]);

  const korean = JSON.parse(extractJson(koreanText)) as DigestSection;
  const global = JSON.parse(extractJson(globalText)) as DigestSection;

  const insightText = await callGroq(buildInsightPrompt(korean, global));
  const investmentInsights = JSON.parse(extractJson(insightText)) as string[];

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
