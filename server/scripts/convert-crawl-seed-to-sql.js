// 자동 크롤링 가전 규격 시드 (3개 카테고리) -> 신규 마이그레이션 SQL 변환
// 기존 convert-appliance-seed-to-sql.js (Phase 1 시드)는 그대로 두고,
// 본 스크립트는 별도 마이그레이션을 생성합니다.
//
// 사용법: node server/scripts/convert-crawl-seed-to-sql.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = [
  'appliance-seed-refrigerators-from-crawl.json',
  'appliance-seed-kimchi-from-crawl.json',
  'appliance-seed-dishwashers-from-crawl.json',
];

// 신규 마이그레이션 — 기존 20260426160000 마이그레이션을 건드리지 않음.
const OUT_DIR = path.join(
  ROOT,
  'server',
  'prisma',
  'migrations',
  '20260427000000_seed_appliance_specs_from_crawl'
);
const OUT_PATH = path.join(OUT_DIR, 'migration.sql');

function genId(modelCode) {
  return 'aspc_' + crypto.createHash('sha256').update(modelCode).digest('hex').slice(0, 20);
}

function sqlEscape(s) {
  if (s === null || s === undefined) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function sqlInt(n) {
  if (n === null || n === undefined) return 'NULL';
  const v = Number(n);
  if (!Number.isFinite(v)) return 'NULL';
  return String(Math.round(v));
}

function sqlBool(b) {
  return b ? 'TRUE' : 'FALSE';
}

function sqlTextArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 'ARRAY[]::TEXT[]';
  const parts = arr.map((s) => "'" + String(s).replace(/'/g, "''") + "'");
  return 'ARRAY[' + parts.join(', ') + ']::TEXT[]';
}

function sqlJsonb(obj) {
  if (obj === null || obj === undefined) return "'[]'::JSONB";
  const json = JSON.stringify(obj);
  return "'" + json.replace(/'/g, "''") + "'::JSONB";
}

let inserted = 0;
let skipped = 0;
const seenModelCodes = new Set();
const inserts = [];

for (const file of FILES) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`SKIP (missing): ${file}`);
    continue;
  }
  let arr;
  try {
    arr = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (e) {
    console.error(`PARSE ERROR in ${file}:`, e.message);
    continue;
  }
  if (!Array.isArray(arr)) {
    console.error(`NOT AN ARRAY: ${file}`);
    continue;
  }

  for (const spec of arr) {
    if (!spec.modelCode || !spec.category || !spec.brand || !spec.productName) {
      skipped++;
      continue;
    }
    if (
      typeof spec.widthMm !== 'number' ||
      typeof spec.heightMm !== 'number' ||
      typeof spec.depthMm !== 'number'
    ) {
      skipped++;
      continue;
    }
    if (seenModelCodes.has(spec.modelCode)) {
      skipped++;
      continue;
    }
    seenModelCodes.add(spec.modelCode);

    const id = genId(spec.modelCode);
    const consensusCount = typeof spec.consensusCount === 'number' ? spec.consensusCount : 1;
    const verifyStatus = spec.verifyStatus || 'PENDING';
    const lastVerifiedAt = consensusCount >= 2 ? 'NOW()' : 'NULL';

    const cols = [
      'id', 'category', 'brand', 'modelCode', 'modelAliases', 'productName',
      'widthMm', 'heightMm', 'depthMm',
      'hingeOpenWidthMm', 'ventTopMm', 'ventSideMm', 'ventBackMm',
      'doorType', 'capacityL', 'builtIn', 'releaseYear', 'discontinued',
      'sources', 'consensusCount', 'verifyStatus', 'lastVerifiedAt',
      'updatedAt',
    ];
    const vals = [
      sqlEscape(id),
      sqlEscape(spec.category),
      sqlEscape(spec.brand),
      sqlEscape(spec.modelCode),
      sqlTextArray(spec.modelAliases || []),
      sqlEscape(spec.productName),
      sqlInt(spec.widthMm),
      sqlInt(spec.heightMm),
      sqlInt(spec.depthMm),
      sqlInt(spec.hingeOpenWidthMm),
      sqlInt(spec.ventTopMm),
      sqlInt(spec.ventSideMm),
      sqlInt(spec.ventBackMm),
      sqlEscape(spec.doorType == null ? null : spec.doorType),
      sqlInt(spec.capacityL),
      sqlBool(spec.builtIn),
      sqlInt(spec.releaseYear),
      sqlBool(spec.discontinued),
      sqlJsonb(spec.sources || []),
      sqlInt(consensusCount),
      sqlEscape(verifyStatus),
      lastVerifiedAt,
      'NOW()',
    ];

    inserts.push(
      `INSERT INTO "appliance_specs" (${cols.map((c) => `"${c}"`).join(', ')})\n` +
        `VALUES (${vals.join(', ')})\n` +
        `ON CONFLICT ("modelCode") DO NOTHING;`
    );
    inserted++;
  }
}

const header = `-- 가전 규격 DB 시드 — 자동 크롤링 분 (2026-04-26 수집)
-- 출처: 삼성 SEC / LG lge.co.kr 공식 페이지
-- 생성: appliance-seed-*-from-crawl.json (3개 파일, ${inserted}건)
-- 정책: ON CONFLICT (modelCode) DO NOTHING — 기존 데이터 보존
-- 검증 상태: PENDING (단일 출처 — 정식 운영 시 다른 출처와 합의 필요)

`;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_PATH, header + inserts.join('\n\n') + '\n');

console.log(`Generated ${OUT_PATH}`);
console.log(`   Inserted: ${inserted}`);
console.log(`   Skipped: ${skipped}`);
