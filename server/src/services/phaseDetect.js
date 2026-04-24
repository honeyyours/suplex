// 일정 content에서 키워드를 찾아 phase(공종)를 자동 감지.
// - 활성 규칙만 사용
// - 키워드 길이 내림차순 (긴 키워드 우선) — "철거공사" > "철거"
// - 대소문자 무시
// - 회사별 5분 캐시 (자동분류 엔진과 동일한 패턴)

const prisma = require('../config/prisma');

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
  return null;
}

module.exports = { detectPhase, invalidateCache };
