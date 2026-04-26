// 가전 규격 DB — 글로벌 (모든 회사 공유)
// 모델명 검색·자동완성 + 어드민 CRUD + 사용자 정정
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired, requireRole } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

const APPLI_CATEGORIES = ['REFRIGERATOR', 'DISHWASHER', 'WASHING_MACHINE', 'DRYER', 'OVEN', 'COOKTOP', 'AIR_CONDITIONER'];
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
