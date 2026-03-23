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

  const [koreanResults, globalResults] = await Promise.all([
    Promise.all(KOREAN_SOURCES.map((s) => fetchFeed(s.url, s.name).then((items) => ({ name: s.name, items })))),
    Promise.all(GLOBAL_SOURCES.map((s) => fetchFeed(s.url, s.name).then((items) => ({ name: s.name, items })))),
  ]);

  for (const r of koreanResults) {
    console.log(`[국내] ${r.name}: ${r.items.length}건`);
  }
  const koreanItems = koreanResults.flatMap((r) => r.items);
  const globalItems = globalResults.flatMap((r) => r.items);
  console.log(`[국내 합계] ${koreanItems.length}건 | [해외 합계] ${globalItems.length}건`);

  if (koreanItems.length === 0 && globalItems.length === 0) {
    return Response.json({ error: '수집된 뉴스가 없습니다' }, { status: 404 });
  }

  try {
    const digest = await generateDigest(koreanItems, globalItems);

    // Enrich headlines with image URLs from raw RSS items (LLM returns links, we map to images)
    const imageMap = new Map<string, string>();
    for (const item of [...koreanItems, ...globalItems]) {
      if (item.imageUrl && item.link) imageMap.set(item.link, item.imageUrl);
    }
    const enrichSection = (section: typeof digest.korean) => ({
      ...section,
      headlines: section.headlines.map((h) => ({
        ...h,
        imageUrl: imageMap.get(h.link),
      })),
    });
    const enrichedDigest = {
      ...digest,
      korean: {
        ...enrichSection(digest.korean),
        rawItems: koreanItems.slice(0, 30).map((item) => ({
          ...item,
          description: item.description.slice(0, 200),
        })),
      },
      global: {
        ...enrichSection(digest.global),
        rawItems: globalItems.slice(0, 30).map((item) => ({
          ...item,
          description: item.description.slice(0, 200),
        })),
      },
    };

    await saveDigest(enrichedDigest);
    cacheTime = Date.now();
    return Response.json({
      ...enrichedDigest,
      cached: false,
      newsCount: { korean: koreanItems.length, global: globalItems.length },
    });
  } catch (error) {
    console.error('브리핑 생성 오류:', error);
    // 429 등 API 오류 시 마지막 캐시 데이터로 fallback
    const fallback = await loadLatestDigest();
    if (fallback) {
      return Response.json({ ...fallback, cached: true });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : '브리핑 생성 실패' },
      { status: 500 }
    );
  }
}
