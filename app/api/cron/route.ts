import { fetchRecentNews } from '@/lib/news-fetcher';
import { summarizeNews } from '@/lib/summarizer';
import { sendTelegramBriefing } from '@/lib/notifier';

export async function GET(request: Request) {
  // Vercel Cron 보안: CRON_SECRET으로 인증
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const news = await fetchRecentNews(24);

    if (news.length === 0) {
      return Response.json({ message: '수집된 뉴스가 없습니다' });
    }

    const briefing = await summarizeNews(news);
    await sendTelegramBriefing(briefing);

    return Response.json({
      success: true,
      date: briefing.date,
      newsCount: news.length,
    });
  } catch (error) {
    console.error('브리핑 생성 오류:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
