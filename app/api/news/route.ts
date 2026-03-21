import { fetchFeed } from '@/lib/rss';
import { KOREAN_SOURCES, GLOBAL_SOURCES } from '@/lib/sources';
import { generateDigest } from '@/lib/gemini';
import { saveDigest, loadLatestDigest } from '@/lib/digest';

const CACHE_TTL = 60 * 60 * 1000; // 1시간
let cacheTime: number | null = null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';

  if (!forceRefresh && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
    const cached = await loadLatestDigest();
    if (cached) return Response.json({ ...cached, cached: true });
  }

  const [koreanItems, globalItems] = await Promise.all([
    Promise.all(KOREAN_SOURCES.map((s: { name: string; url: string }) => fetchFeed(s.url, s.name))).then((r) => r.flat()),
    Promise.all(GLOBAL_SOURCES.map((s: { name: string; url: string }) => fetchFeed(s.url, s.name))).then((r) => r.flat()),
  ]);

  if (koreanItems.length === 0 && globalItems.length === 0) {
    return Response.json({ error: '수집된 뉴스가 없습니다' }, { status: 404 });
  }

  try {
    const digest = await generateDigest(koreanItems, globalItems);
    await saveDigest(digest);
    cacheTime = Date.now();
    return Response.json({ ...digest, cached: false });
  } catch (error) {
    console.error('Gemini 브리핑 생성 오류:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '브리핑 생성 실패' },
      { status: 500 }
    );
  }
}
