import Groq from 'groq-sdk';
import type { NewsItem } from './news-fetcher';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.1-8b-instant';

export interface NewsBriefing {
  date: string;
  macro: string;
  tech: string;
  realEstate?: string;
  signal: '매수우세' | '중립' | '매도우세';
  signalReason: string;
  riskLevel: 'HIGH' | 'MED' | 'LOW';
  rawNewsCount: number;
}

export async function summarizeNews(news: NewsItem[]): Promise<NewsBriefing> {
  const newsText = news
    .slice(0, 30)
    .map((n) => `[${n.category}] ${n.source} | ${n.title}`)
    .join('\n');

  const today = new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `${today} 경제 뉴스 분석. JSON만 반환:\n\n${newsText}\n\n{"macro":"📊 매크로: 금리·환율·경기 영향과 리스크 2문장","tech":"💻 테크·기업: 실적·섹터 기회와 리스크 2문장","realEstate":"🏠 부동산: 금리·정책 영향 1문장(관련 없으면 null)","signal":"매수우세|중립|매도우세","signalReason":"⚡ 투자 시그널 근거 한 줄","riskLevel":"HIGH|MED|LOW"}`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Groq response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    date: today,
    macro: parsed.macro || '',
    tech: parsed.tech || '',
    realEstate: parsed.realEstate || undefined,
    signal: parsed.signal ?? '중립',
    signalReason: parsed.signalReason || '',
    riskLevel: parsed.riskLevel ?? 'MED',
    rawNewsCount: news.length,
  };
}
