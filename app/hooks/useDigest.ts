import { useState, useCallback } from 'react';
import type { DigestResponse } from '@/app/types';

export function useDigest() {
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDigest = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(forceRefresh ? '/api/news?refresh=true' : '/api/news');
      const data: DigestResponse = await res.json();
      if (!res.ok) throw new Error(data.error || '오류가 발생했습니다');
      setDigest(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  return { digest, loading, error, fetchDigest };
}
