import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  const { messages, context } = await request.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    context?: string;
  };

  const systemPrompt = `당신은 15년 경력의 전문 투자/금융 애널리스트입니다. 사용자의 투자·경제 질문에 한국어로 명확하고 실용적으로 답변합니다.

${context ? `=== 오늘의 시장 컨텍스트 ===\n${context}\n===========================\n` : ''}

답변 원칙:
- 오늘의 시장 컨텍스트를 적극 활용해 구체적·시의성 있게 답변
- 수치와 근거를 들어 설명하되 지나치게 길지 않게
- 투자에 따른 리스크도 함께 언급
- 투자 최종 판단은 사용자 본인의 책임임을 필요시 명시
- 투자와 무관한 질문은 정중히 투자 관련 주제로 유도`;

  const stream = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 1200,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
