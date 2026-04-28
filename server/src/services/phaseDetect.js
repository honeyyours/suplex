// 일정 content에서 키워드를 찾아 phase(공종)를 자동 감지.
// - 활성 규칙만 사용
// - 키워드 길이 내림차순 (긴 키워드 우선) — "철거공사" > "철거"
// - 대소문자 무시
// - 회사별 5분 캐시 (자동분류 엔진과 동일한 패턴)
// - 회사 룰 매칭 실패 시 fallback: 표준 25개 라벨 + BUILT_IN_ALIASES (코드 상수)
//   → 회사가 PhaseKeywordRule 비어있어도 "방수" 입력하면 자동 "방수"로 인식

const prisma = require('../config/prisma');
const { STANDARD_PHASES, BUILT_IN_ALIASES } = require('./phases');

// fallback 키워드 — 표준 라벨 + 별칭. 길이 내림차순 정렬 (긴 키워드 우선)
const FALLBACK_KEYWORDS = (() => {
  const list = [];
  for (const p of STANDARD_PHASES) {
    if (p.key === 'OTHER') continue;
    list.push({ keyword: p.label, phase: p.label });
  }
  for (const [alias, label] of Object.entries(BUILT_IN_ALIASES)) {
    list.push({ keyword: alias, phase: label });
  }
  list.sort((a, b) => b.keyword.length - a.keyword.length);
  return list;
})();

const CACHE = new Map(); // companyId -> { rules: [...], expiresAt: number }
const TTL_MS = 5 * 60 * 1000;

async function loadRules(companyId) {
  const cached = CACHE.get(companyId);
  if (cached && cached.expiresAt > Date.now()) return cached.rules;

  const rules = await prisma.phaseKeywordRule.findMany({
    where: { companyId, active: true },
    select: { keyword: true, phase: true },
  });
  // 긴 키워드 우선
  rules.sort((a, b) => b.keyword.length - a.keyword.length);
  CACHE.set(companyId, { rules, expiresAt: Date.now() + TTL_MS });
  return rules;
}

function invalidateCache(companyId) {
  CACHE.delete(companyId);
}

async function detectPhase(companyId, text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const rules = await loadRules(companyId);
  for (const r of rules) {
    if (lower.includes(r.keyword.toLowerCase())) return r.phase;
  }
  // Fallback — 회사 룰 매칭 실패 시 표준 라벨/별칭으로 매칭
  for (const fb of FALLBACK_KEYWORDS) {
    if (lower.includes(fb.keyword.toLowerCase())) return fb.phase;
  }
  return null;
}

// 매칭 결과를 위치 정보와 함께 반환 — 프론트에서 inline chip 렌더링에 사용
// 반환: { phase, keyword, start, end } | null
//   - keyword: text 원본의 substring (대소문자 보존)
//   - start/end: text 내 위치 (end는 exclusive)
async function detectPhaseMatch(companyId, text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const rules = await loadRules(companyId);
  for (const r of rules) {
    const kwLower = r.keyword.toLowerCase();
    const idx = lower.indexOf(kwLower);
    if (idx >= 0) {
      return {
        phase: r.phase,
        keyword: text.slice(idx, idx + r.keyword.length),
        start: idx,
        end: idx + r.keyword.length,
      };
    }
  }
  // Fallback — 회사 룰 매칭 실패 시 표준 라벨/별칭으로
  for (const fb of FALLBACK_KEYWORDS) {
    const kwLower = fb.keyword.toLowerCase();
    const idx = lower.indexOf(kwLower);
    if (idx >= 0) {
      return {
        phase: fb.phase,
        keyword: text.slice(idx, idx + fb.keyword.length),
        start: idx,
        end: idx + fb.keyword.length,
      };
    }
  }
  return null;
}

module.exports = { detectPhase, detectPhaseMatch, invalidateCache };
