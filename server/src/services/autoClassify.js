// 자동분류 엔진 — 키워드 룰로 description/vendor 분석 → accountCode/site/work 자동 할당
// 사용처: CSV 가져오기 미리보기 + Expense 생성 (description/vendor 입력 시 자동 추천)
const prisma = require('../config/prisma');

// 룰 캐시 (5분 TTL — 회사별)
const cache = new Map(); // companyId → { rules, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000;

async function loadRules(companyId) {
  const now = Date.now();
  const cached = cache.get(companyId);
  if (cached && cached.expiresAt > now) return cached.rules;
  const rules = await prisma.expenseCategoryRule.findMany({
    where: { companyId, active: true },
    orderBy: [{ priority: 'desc' }, { keyword: 'desc' }], // 긴 키워드가 먼저 매칭되도록
  });
  // 키워드 길이 내림차순 (priority 같을 때) — "한국전력공사"가 "한국"보다 먼저
  rules.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.keyword.length - a.keyword.length;
  });
  cache.set(companyId, { rules, expiresAt: now + CACHE_TTL_MS });
  return rules;
}

function invalidateCache(companyId) {
  cache.delete(companyId);
}

// 단일 텍스트 분류 — 룰 우선순위·길이 순으로 매칭, 첫 매칭 반환
function classify(rules, text) {
  if (!text) return null;
  const haystack = String(text).toLowerCase();
  for (const rule of rules) {
    const needle = rule.keyword.toLowerCase();
    if (haystack.includes(needle)) {
      return {
        ruleId: rule.id,
        keyword: rule.keyword,
        accountCodeId: rule.accountCodeId,
        siteCode: rule.siteCode,
        workCategory: rule.workCategory,
      };
    }
  }
  return null;
}

async function classifyOne(companyId, text) {
  const rules = await loadRules(companyId);
  return classify(rules, text);
}

async function classifyMany(companyId, texts) {
  const rules = await loadRules(companyId);
  return texts.map((t) => classify(rules, t));
}

module.exports = { classifyOne, classifyMany, loadRules, invalidateCache };
