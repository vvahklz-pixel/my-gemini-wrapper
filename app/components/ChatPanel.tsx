'use client';

import { useState, useRef, useEffect } from 'react';
import type { Digest } from '@/lib/gemini';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function buildContext(digest: Digest): string {
  const lines: string[] = [];
  lines.push(`[국내 경제] ${digest.korean.summary}`);
  lines.push(`국내 핵심 테마: ${digest.korean.keyThemes.join(', ')}`);
  lines.push(`국내 키워드: ${(digest.korean.keywords ?? []).join(', ')}`);
  lines.push('');
  lines.push(`[글로벌 경제] ${digest.global.summary}`);
  lines.push(`글로벌 핵심 테마: ${digest.global.keyThemes.join(', ')}`);
  lines.push(`글로벌 키워드: ${(digest.global.keywords ?? []).join(', ')}`);
  lines.push('');
  lines.push(`[오늘의 투자 인사이트]`);
  digest.investmentInsights.forEach((insight, i) => {
    lines.push(`${i + 1}. ${insight}`);
  });
  return lines.join('\n');
}

const SUGGESTIONS = [
  '오늘 주목해야 할 종목이 있나요?',
  '지금 달러를 사는 게 좋을까요?',
  '오늘 글로벌 이슈가 국내 증시에 어떤 영향을 줄까요?',
  '지금 금리 상황에서 어떤 자산이 유리한가요?',
];

export default function ChatPanel({
  digest,
  messages,
  setMessages,
}: {
  digest: Digest | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setStreaming(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages([...next, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          context: digest ? buildContext(digest) : undefined,
        }),
      });

      if (!res.ok || !res.body) throw new Error('응답 오류');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '죄송합니다, 응답 중 오류가 발생했습니다. 다시 시도해 주세요.',
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welcome */}
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5">
              <p className="text-sm font-semibold text-[#191F28] mb-1">투자 전문 AI 애널리스트</p>
              <p className="text-sm text-[#8B95A1] leading-relaxed">
                오늘의 시장 데이터를 바탕으로 투자·경제 관련 질문에 답변드립니다.
                {digest ? ' 오늘 뉴스 컨텍스트가 로드되었습니다.' : ' 뉴스를 먼저 불러오면 더 정확한 답변이 가능합니다.'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#8B95A1] mb-2 px-1">추천 질문</p>
              <div className="space-y-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full text-left bg-white rounded-xl px-4 py-3 text-sm text-[#191F28] hover:bg-[#EBF3FE] hover:text-[#3182F6] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex-none w-7 h-7 rounded-full bg-[#3182F6] flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#3182F6] text-white rounded-tr-sm'
                  : 'bg-white text-[#191F28] rounded-tl-sm'
              }`}
            >
              {msg.content}
              {msg.role === 'assistant' && streaming && i === messages.length - 1 && msg.content === '' && (
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-[#B0B8C1] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-[#B0B8C1] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-[#B0B8C1] rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-none border-t border-[#E5E8EB] bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="투자·경제 관련 질문을 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
            rows={1}
            disabled={streaming}
            className="flex-1 resize-none rounded-xl border border-[#E5E8EB] px-4 py-2.5 text-sm text-[#191F28] placeholder-[#B0B8C1] focus:outline-none focus:border-[#3182F6] disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || streaming}
            className="flex-none w-10 h-10 rounded-xl bg-[#3182F6] flex items-center justify-center text-white disabled:opacity-40 transition-opacity active:scale-95"
            aria-label="전송"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
