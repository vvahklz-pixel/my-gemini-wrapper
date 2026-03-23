import { exec } from 'child_process';
import type { NewsBriefing } from './summarizer';

export function sendMacOSNotification(title: string, body: string): void {
  const safeTitle = title.replace(/"/g, '\\"').replace(/'/g, "\\'");
  const safeBody = body.replace(/"/g, '\\"').replace(/'/g, "\\'").slice(0, 200);
  exec(
    `osascript -e 'display notification "${safeBody}" with title "${safeTitle}" sound name "Glass"'`,
    (err) => { if (err) console.warn('[macOS] 알림 전송 실패:', err.message); }
  );
}

export async function sendTelegramBriefing(briefing: NewsBriefing): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID 환경변수가 없습니다');
  }

  const message =
    `📰 *경제 뉴스 브리핑* — ${briefing.date}\n` +
    `\n` +
    `📊 *매크로*\n${briefing.macro}\n` +
    `\n` +
    `💻 *테크·기업*\n${briefing.tech}\n` +
    (briefing.realEstate ? `\n🏠 *부동산*\n${briefing.realEstate}\n` : '') +
    `\n` +
    `⚡ *투자 시그널:* [${briefing.signal}] ${briefing.signalReason}\n` +
    `\n` +
    `🔴 *리스크 레벨:* [${briefing.riskLevel}]\n` +
    `\n` +
    `_뉴스 ${briefing.rawNewsCount}건 분석 완료_`;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Telegram API 오류: ${error}`);
  }
}
