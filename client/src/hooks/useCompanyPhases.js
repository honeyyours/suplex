import { useQuery } from '@tanstack/react-query';
import { phasesApi } from '../api/phases';

const FALLBACK_PHASES = [
  '철거', '목공', '전기', '설비', '타일', '도배', '도장', '필름', '마루', '준공',
];

// 회사가 사용 중인 공정 목록 (기본 10개 + 회사 추가분).
// 5분 캐시 — 키워드/공정 변경 시 invalidate(['phases'])로 갱신.
// 네트워크 실패/로딩 중에는 기본 10개로 fallback.
export function useCompanyPhases() {
  const { data } = useQuery({
    queryKey: ['phases'],
    queryFn: () => phasesApi.list(),
    staleTime: 5 * 60 * 1000,
  });
  return data?.phases?.length ? data.phases : FALLBACK_PHASES;
}
