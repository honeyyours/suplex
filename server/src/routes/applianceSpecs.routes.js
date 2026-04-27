// 가전 규격 DB — 글로벌 (모든 회사 공유)
// 모델명 검색·자동완성 + 어드민 CRUD + 사용자 정정
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired, requireRole } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

const APPLI_CATEGORIES = ['REFRIGERATOR', 'KIMCHI_REFRIGERATOR', 'DISHWASHER', 'WASHING_MACHINE', 'DRYER', 'OVEN', 'COOKTOP', 'AIR_CONDITIONER', 'ROBOT_VACUUM'];
const VERIFY_STATUSES = ['VERIFIED', 'PENDING', 'DISPUTED', 'USER_CORRECTED'];

// ============================================
// 검색 / 자동완성 (인증된 모든 사용자)
// ============================================

// GET /api/appliance-specs/search?q=...&category=REFRIGERATOR&brand=LG
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const category = req.query.category || undefined;
    const brand = req.query.brand || undefined;
    const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 50);

    const where = {};
    if (category) where.category = category;
    if (brand) where.brand = brand;

    if (q) {
      where.OR = [
        { modelCode: { contains: q, mode: 'insensitive' } },
        { productName: { contains: q, mode: 'insensitive' } },
        { modelAliases: { has: q } },
      ];
    }

    const specs = await prisma.applianceSpec.findMany({
      where,
      orderBy: [{ discontinued: 'asc' }, { brand: 'asc' }, { modelCode: 'asc' }],
      take: limit,
      include: { correctedBy: { select: { id: true, name: true } } },
    });

    res.json({ specs });
  } catch (e) { next(e); }
});

// GET /api/appliance-specs/:id — 상세 (출처 포함)
router.get('/:id', async (req, res, next) => {
  try {
    const spec = await prisma.applianceSpec.findUnique({
      where: { id: req.params.id },
      include: { correctedBy: { select: { id: true, name: true } } },
    });
    if (!spec) return res.status(404).json({ error: 'Not found' });
    res.json({ spec });
  } catch (e) { next(e); }
});

// GET /api/appliance-specs — 어드민 목록
router.get('/', async (req, res, next) => {
  try {
    const category = req.query.category || undefined;
    const brand = req.query.brand || undefined;
    const verifyStatus = req.query.verifyStatus || undefined;
    const includeDiscontinued = req.query.includeDiscontinued === 'true';

    const where = {};
    if (category) where.category = category;
    if (brand) where.brand = brand;
    if (verifyStatus) where.verifyStatus = verifyStatus;
    if (!includeDiscontinued) where.discontinued = false;

    const specs = await prisma.applianceSpec.findMany({
      where,
      orderBy: [{ category: 'asc' }, { brand: 'asc' }, { modelCode: 'asc' }],
      include: { correctedBy: { select: { id: true, name: true } } },
    });

    res.json({ specs });
  } catch (e) { next(e); }
});

// ============================================
// 어드민 CRUD (OWNER 전용)
// ============================================

const sourceSchema = z.object({
  tier: z.number().int().min(1).max(5),
  url: z.string().trim().min(1),
  scrapedAt: z.string().optional(),
  value: z.record(z.any()).optional(), // 출처별 측정값 보존 (분쟁 시 추적)
  note: z.string().optional(),
});

const specSchema = z.object({
  category: z.enum(APPLI_CATEGORIES),
  brand: z.string().trim().min(1).max(50),
  modelCode: z.string().trim().min(1).max(100),
  modelAliases: z.array(z.string().trim()).optional().default([]),
  productName: z.string().trim().min(1).max(200),
  widthMm: z.number().int().min(100).max(5000),
  heightMm: z.number().int().min(100).max(5000),
  depthMm: z.number().int().min(100).max(5000),
  hingeOpenWidthMm: z.number().int().min(0).max(5000).optional().nullable(),
  ventTopMm: z.number().int().min(0).max(1000).optional().nullable(),
  ventSideMm: z.number().int().min(0).max(1000).optional().nullable(),
  ventBackMm: z.number().int().min(0).max(1000).optional().nullable(),
  doorType: z.string().trim().max(50).optional().nullable(),
  capacityL: z.number().int().min(0).max(10000).optional().nullable(),
  builtIn: z.boolean().optional(),
  releaseYear: z.number().int().min(1990).max(2100).optional().nullable(),
  discontinued: z.boolean().optional(),
  sources: z.array(sourceSchema).optional().default([]),
  verifyStatus: z.enum(VERIFY_STATUSES).optional(),
});

function computeConsensus(sources) {
  // 같은 (width,height,depth) 조합이 몇 개 출처에서 일치하는지
  if (!sources || sources.length === 0) return 0;
  const counts = {};
  for (const s of sources) {
    if (!s.value) continue;
    const key = `${s.value.widthMm}-${s.value.heightMm}-${s.value.depthMm}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return Math.max(0, ...Object.values(counts));
}

router.post('/', requireRole('OWNER'), async (req, res, next) => {
  try {
    const data = specSchema.parse(req.body);
    const consensusCount = computeConsensus(data.sources);
    const spec = await prisma.applianceSpec.create({
      data: {
        ...data,
        consensusCount,
        verifyStatus: data.verifyStatus || (consensusCount >= 2 ? 'VERIFIED' : 'PENDING'),
        lastVerifiedAt: consensusCount >= 2 ? new Date() : null,
      },
    });
    res.status(201).json({ spec });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    if (e.code === 'P2002') return res.status(409).json({ error: 'modelCode already exists' });
    next(e);
  }
});

router.patch('/:id', requireRole('OWNER'), async (req, res, next) => {
  try {
    const existing = await prisma.applianceSpec.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const data = specSchema.partial().parse(req.body);

    const update = { ...data };
    if (data.sources) {
      const consensusCount = computeConsensus(data.sources);
      update.consensusCount = consensusCount;
      if (!data.verifyStatus) {
        update.verifyStatus = consensusCount >= 2 ? 'VERIFIED' : 'PENDING';
      }
      if (consensusCount >= 2) update.lastVerifiedAt = new Date();
    }

    const spec = await prisma.applianceSpec.update({
      where: { id: req.params.id },
      data: update,
    });
    res.json({ spec });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    if (e.code === 'P2002') return res.status(409).json({ error: 'modelCode already exists' });
    next(e);
  }
});

router.delete('/:id', requireRole('OWNER'), async (req, res, next) => {
  try {
    const existing = await prisma.applianceSpec.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prisma.applianceSpec.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================
// 자동 학습 — 사용자가 마감재에 입력한 가전 데이터 자동 누적 (Phase A-2)
// 회사간 공유 (Suplex 공통 자가증식 DB)
// 같은 사이즈 → consensusCount++, 다른 사이즈 → DISPUTED
// ============================================

const learnSchema = z.object({
  modelCode: z.string().trim().min(1).max(100),
  productName: z.string().trim().max(200).optional(),
  brand: z.string().trim().max(50).optional(),
  category: z.enum(APPLI_CATEGORIES).optional(),
  sizeStr: z.string().trim().min(1), // "598 × 567 × 815" 형식 (W × D × H)
});

function parseSizeStr(s) {
  if (!s) return null;
  const m = s.match(/(\d{2,4})\s*[×x*Xㅅ]\s*(\d{2,4})\s*[×x*Xㅅ]\s*(\d{2,4})/);
  if (!m) return null;
  // ProjectMaterialsSimple 표기: W × D × H 순서
  return { widthMm: +m[1], depthMm: +m[2], heightMm: +m[3] };
}

router.post('/learn', async (req, res, next) => {
  try {
    const data = learnSchema.parse(req.body);
    const dims = parseSizeStr(data.sizeStr);
    if (!dims) {
      return res.json({ skipped: true, reason: 'unparseable_size' });
    }
    // 가전 일반 범위 sanity 검사
    if (dims.widthMm < 100 || dims.widthMm > 5000
      || dims.heightMm < 100 || dims.heightMm > 5000
      || dims.depthMm < 100 || dims.depthMm > 5000) {
      return res.json({ skipped: true, reason: 'size_out_of_range' });
    }

    const existing = await prisma.applianceSpec.findUnique({
      where: { modelCode: data.modelCode },
    });

    const userSource = {
      tier: 4, // tier 1=제조사 공식, 2=2차자료(다나와 등), 3=리뷰, 4=사용자 보고, 5=매뉴얼
      url: `user-input://${req.user.companyId}/${req.user.id}`,
      value: { widthMm: dims.widthMm, heightMm: dims.heightMm, depthMm: dims.depthMm },
      note: `사용자 자동 학습 (${new Date().toISOString().slice(0, 10)})`,
    };

    if (!existing) {
      // 신규 — PENDING으로 INSERT (회사간 공유)
      const newSpec = await prisma.applianceSpec.create({
        data: {
          modelCode: data.modelCode,
          category: data.category || 'REFRIGERATOR', // 카테고리 미지정 시 기본값
          brand: data.brand || 'unknown',
          productName: data.productName || data.modelCode,
          widthMm: dims.widthMm,
          heightMm: dims.heightMm,
          depthMm: dims.depthMm,
          builtIn: false,
          discontinued: false,
          consensusCount: 1,
          verifyStatus: 'PENDING',
          sources: [userSource],
        },
      });
      return res.json({ action: 'created', specId: newSpec.id });
    }

    // 기존 모델 — 사이즈 비교
    const sameDims = (
      existing.widthMm === dims.widthMm
      && existing.heightMm === dims.heightMm
      && existing.depthMm === dims.depthMm
    );

    const newSources = [...(existing.sources || []), userSource];

    // 같은 사용자가 같은 모델로 여러 번 호출 시 노이즈 방지 (5초 디바운스를 프론트가 담당하지만
    // 동시 요청 등 예외 케이스 안전망: 같은 (companyId, userId)의 출처가 이미 있으면 sources 갱신만)
    const sameOriginExists = (existing.sources || []).some(
      (s) => s.url === userSource.url
    );

    if (sameDims) {
      // 같은 사이즈 — consensus 증가, USER_CORRECTED는 보호
      const newCount = sameOriginExists
        ? existing.consensusCount
        : (existing.consensusCount || 1) + 1;
      const newStatus = (newCount >= 2 && existing.verifyStatus !== 'USER_CORRECTED')
        ? 'VERIFIED'
        : existing.verifyStatus;
      const updated = await prisma.applianceSpec.update({
        where: { id: existing.id },
        data: {
          consensusCount: newCount,
          verifyStatus: newStatus,
          sources: newSources,
          lastVerifiedAt: newCount >= 2 ? new Date() : existing.lastVerifiedAt,
        },
      });
      return res.json({
        action: sameOriginExists ? 'duplicate_origin' : 'consensus_up',
        specId: updated.id,
        consensusCount: newCount,
        verifyStatus: newStatus,
      });
    } else {
      // 다른 사이즈 — DISPUTED (USER_CORRECTED는 보호: 사용자 정정 우선)
      if (existing.verifyStatus === 'USER_CORRECTED') {
        // 출처만 추가, 상태/사이즈는 그대로
        await prisma.applianceSpec.update({
          where: { id: existing.id },
          data: { sources: newSources },
        });
        return res.json({ action: 'noted_under_user_corrected', specId: existing.id });
      }
      const updated = await prisma.applianceSpec.update({
        where: { id: existing.id },
        data: { verifyStatus: 'DISPUTED', sources: newSources },
      });
      return res.json({ action: 'disputed', specId: updated.id });
    }
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// ============================================
// 사용자 정정 (모든 인증 사용자 가능 — 디자이너가 실측치 보고)
// ============================================

const correctSchema = z.object({
  widthMm: z.number().int().min(100).max(5000).optional(),
  heightMm: z.number().int().min(100).max(5000).optional(),
  depthMm: z.number().int().min(100).max(5000).optional(),
  hingeOpenWidthMm: z.number().int().min(0).max(5000).optional().nullable(),
  ventTopMm: z.number().int().min(0).max(1000).optional().nullable(),
  ventSideMm: z.number().int().min(0).max(1000).optional().nullable(),
  ventBackMm: z.number().int().min(0).max(1000).optional().nullable(),
  correctionNote: z.string().trim().min(1).max(500),
});

router.post('/:id/correct', async (req, res, next) => {
  try {
    const existing = await prisma.applianceSpec.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const data = correctSchema.parse(req.body);

    const spec = await prisma.applianceSpec.update({
      where: { id: req.params.id },
      data: {
        ...data,
        verifyStatus: 'USER_CORRECTED',
        correctedById: req.user.id,
        correctedAt: new Date(),
        correctionNote: data.correctionNote,
      },
      include: { correctedBy: { select: { id: true, name: true } } },
    });
    res.json({ spec });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

module.exports = router;
