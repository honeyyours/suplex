// 가전 규격 시드 JSON 4개 → 단일 SQL 마이그레이션으로 변환
// 사용법: node server/scripts/convert-appliance-seed-to-sql.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = [
  'appliance-seed-refrigerators.json',
  'appliance-seed-kimchi.json',
  'appliance-seed-dishwashers.json',
  'appliance-seed-robot-vacuums.json',
];

const OUT_DIR = path.join(ROOT, 'server', 'prisma', 'migrations', '20260426160000_seed_appliance_specs');
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
  if (!Array.isArray(arr) || arr.length === 0) return "ARRAY[]::TEXT[]";
  const parts = arr.map((s) => "'" + String(s).replace(/'/g, "''") + "'");
  return 'ARRAY[' + parts.join(', ') + ']::TEXT[]';
}

function sqlJsonb(obj) {
  if (obj === null || obj === undefined) return "'[]'::JSONB";
  const json = JSON.stringify(obj);
  return "'" + json.replace(/'/g, "''") + "'::JSONB";
}

function deriveConsensus(spec) {
  const sources = spec.sources || [];
  if (typeof spec.consensusCount === 'number') return spec.consensusCount;
  if (sources.length === 0) return 0;
  // Group by W-H-D from value field
  const groups = {};
  for (const s of sources) {
    const v = s.value || {};
    const k = `${v.widthMm || ''}-${v.heightMm || ''}-${v.depthMm || ''}`;
    groups[k] = (groups[k] || 0) + 1;
  }
  return Math.max(0, ...Object.values(groups));
}

function deriveStatus(spec) {
  if (spec.verifyStatus) return spec.verifyStatus;
  const cc = deriveConsensus(spec);
  if (cc >= 2) return 'VERIFIED';
  return 'PENDING';
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
    // 필수 필드 검증
    if (!spec.modelCode || !spec.category || !spec.brand || !spec.productName) {
      skipped++;
      console.warn(`SKIP (missing required): ${JSON.stringify(spec).slice(0, 100)}`);
      continue;
    }
    if (typeof spec.widthMm !== 'number' || typeof spec.heightMm !== 'number' || typeof spec.depthMm !== 'number') {
      skipped++;
      console.warn(`SKIP (missing dimensions): ${spec.modelCode}`);
      continue;
    }
    // 중복 modelCode (한 시드 내) 방지
    if (seenModelCodes.has(spec.modelCode)) {
      skipped++;
      console.warn(`SKIP (duplicate modelCode): ${spec.modelCode}`);
      continue;
    }
    seenModelCodes.add(spec.modelCode);

    const id = genId(spec.modelCode);
    const consensusCount = deriveConsensus(spec);
    const verifyStatus = deriveStatus(spec);
    const lastVerifiedAt = consensusCount >= 2 ? 'NOW()' : 'NULL';

    const cols = [
      'id', 'category', 'brand', 'modelCode', 'modelAliases', 'productName',
      'widthMm', 'heightMm', 'depthMm',
      'hingeOpenWidthMm', 'ventTopMm', 'ventSideMm', 'ventBackMm',
      'doorType', 'capacityL', 'builtIn', 'releaseYear', 'discontinued',
      'sources', 'consensusCount', 'verifyStatus', 'lastVerifiedAt',
      'updatedAt'
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
      sqlEscape(spec.doorType ?? null),
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

const header = `-- 가전 규격 DB 시드 데이터 (자동 생성)
-- 출처: appliance-seed-*.json (4개 카테고리)
-- 정책: ON CONFLICT (modelCode) DO NOTHING — 재실행 시 기존 데이터 보존
-- 검증 상태: VERIFIED (≥2 출처 일치) / PENDING (단일 출처) / DISPUTED (출처 불일치)

`;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_PATH, header + inserts.join('\n\n') + '\n');

console.log(`✅ Generated ${OUT_PATH}`);
console.log(`   Inserted: ${inserted}`);
console.log(`   Skipped: ${skipped}`);
