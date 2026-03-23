#!/usr/bin/env tsx
/**
 * 아침 경제 브리핑 스크립트
 * 매일 오전 8시 macOS LaunchAgent에 의해 자동 실행됩니다.
 *
 * 직접 실행: npm run brief
 */

import { resolve } from 'path';

// Node 20.12+ 내장 .env 로더 사용 (dotenv 불필요)
const envPath = resolve(process.cwd(), '.env.local');
try {
  process.loadEnvFile(envPath);
} catch {
  console.warn('[ENV] .env.local 없음 — 시스템 환경변수 사용');
}

import { fetchFeed } from '../lib/rss';
import { KOREAN_SOURCES, GLOBAL_SOURCES } from '../lib/sources';
import { generateDigest } from '../lib/gemini';
import { saveDigest } from '../lib/digest';
import { sendMacOSNotification, sendTelegramBriefing } from '../lib/notifier';
import type { NewsBriefing } from '../lib/summarizer';

async function main() {
  const startedAt = new Date();
  console.log(`\n[${startedAt.toLocaleString('ko-KR')}] 📰 아침 경제 브리핑 시작`);

  try {
    // 1. RSS 수집
    console.log('뉴스 수집 중...');
    const [koreanItems, globalItems] = await Promise.all([
      Promise.all(KOREAN_SOURCES.map((s) => fetchFeed(s.url, s.name))).then((r) => r.flat()),
      Promise.all(GLOBAL_SOURCES.map((s) => fetchFeed(s.url, s.name))).then((r) => r.flat()),
    ]);
    console.log(`수집 완료: 국내 ${koreanItems.length}건, 해외 ${globalItems.length}건`);

    if (koreanItems.length === 0 && globalItems.length === 0) {
      const msg = '수집된 뉴스가 없습니다. 네트워크를 확인하세요.';
      console.warn(msg);
      sendMacOSNotification('⚠️ 브리핑 경고', msg);
      return;
    }

    // 2. Gemini AI 요약
    console.log('Gemini AI 분석 중...');
    const digest = await generateDigest(koreanItems, globalItems);
    console.log('분석 완료');

    // 3. 파일 저장
    await saveDigest(digest);

    // 4. macOS 알림 (즉시)
    sendMacOSNotification('📰 경제 뉴스 브리핑 완료', digest.korean.summary.slice(0, 180));

    // 5. Telegram 알림 (선택)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      console.log('Telegram 전송 중...');
      // Digest를 NewsBriefing 포맷으로 변환하여 Telegram 전송
      const briefingForTelegram: NewsBriefing = {
        date: digest.date,
        macro: digest.korean.macroView || digest.global.macroView || '',
        tech: digest.korean.techView || digest.global.techView || '',
        realEstate: digest.korean.realEstateView || digest.global.realEstateView || undefined,
        signal: digest.korean.signal ?? '중립',
        signalReason: digest.korean.signalReason || digest.global.signalReason || '',
        riskLevel: digest.korean.riskLevel ?? 'MED',
        rawNewsCount: koreanItems.length + globalItems.length,
      };
      await sendTelegramBriefing(briefingForTelegram);
      console.log('Telegram 전송 완료');
    } else {
      console.log('[Telegram] 환경변수 없음 — 건너뜀');
    }

    const elapsed = ((Date.now() - startedAt.getTime()) / 1000).toFixed(1);
    console.log(`\n✅ 완료! (${elapsed}초 소요)\n`);
  } catch (err) {
    console.error('❌ 오류:', err);
    sendMacOSNotification('❌ 브리핑 오류', String(err).slice(0, 150));
    process.exit(1);
  }
}

main();
