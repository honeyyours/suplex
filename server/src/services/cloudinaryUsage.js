// Cloudinary 사용량 — 전체 계정 + 회사별 ProjectPhoto 카운트
// Cloudinary api.usage()는 Free 플랜에서도 호출 가능
// 회사별 사진 업로드량은 ProjectPhoto 테이블 카운트 (DB 기준)

const env = require('../config/env');
const prisma = require('../config/prisma');

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache = { at: 0, result: null };

async function getCloudinaryAccountUsage() {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    return { status: 'not_configured', note: 'CLOUDINARY_* 미설정' };
  }
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
      secure: true,
    });
    const usage = await cloudinary.api.usage();
    // 응답에서 사람이 보기 좋은 값만 정리
    return {
      status: 'ok',
      plan: usage.plan,
      credits: usage.credits, // { usage, limit, used_percent }
      bandwidth: usage.bandwidth, // { usage, limit, used_percent }
      storage: usage.storage, // { usage, limit, used_percent }
      requests: usage.requests,
      resources: usage.resources,
      derivedResources: usage.derived_resources,
      transformations: usage.transformations,
      lastUpdated: usage.last_updated,
    };
  } catch (e) {
    return { status: 'error', error: e.message || String(e) };
  }
}

async function getCompanyPhotoCounts() {
  // 회사별 사진 카운트 (DB 기준). 파일 크기는 ProjectPhoto에 컬럼 없어 생략 — Cloudinary 계정 단위 storage로 충분
  const rows = await prisma.$queryRaw`
    SELECT
      c.id AS "companyId",
      c.name AS "companyName",
      COUNT(p.id)::int AS "photoCount"
    FROM companies c
    LEFT JOIN projects pr ON pr."companyId" = c.id
    LEFT JOIN project_photos p ON p."projectId" = pr.id
    GROUP BY c.id, c.name
    ORDER BY "photoCount" DESC, c.name ASC
  `;
  return rows.map((r) => ({
    companyId: r.companyId,
    companyName: r.companyName,
    photoCount: Number(r.photoCount),
  }));
}

async function getUsage({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache.result && now - cache.at < CACHE_TTL_MS) {
    return { ...cache.result, cached: true, cacheAgeMs: now - cache.at };
  }
  const [account, byCompany] = await Promise.all([
    getCloudinaryAccountUsage(),
    getCompanyPhotoCounts(),
  ]);
  const result = {
    checkedAt: new Date().toISOString(),
    account,
    byCompany,
  };
  cache = { at: now, result };
  return { ...result, cached: false, cacheAgeMs: 0 };
}

module.exports = { getUsage };
