const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired, requireRole } = require('../middlewares/auth');
const { audit } = require('../services/audit');

const router = express.Router();
router.use(authRequired);

// GET /api/vendors  — 검색/공종 필터
router.get('/', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const where = { companyId: req.user.companyId };
    if (category) where.category = category;
    if (q) {
      where.OR = [
        { name:    { contains: q, mode: 'insensitive' } },
        { contact: { contains: q, mode: 'insensitive' } },
        { phone:   { contains: q } },
        { memo:    { contains: q, mode: 'insensitive' } },
      ];
    }
    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        linkedCrew: { select: { id: true, name: true, nickname: true, email: true } },
      },
    });
    res.json({ vendors });
  } catch (e) { next(e); }
});

// GET /api/vendors/categories  — 회사에서 사용 중인 공종 목록 (autocomplete용)
router.get('/categories', async (req, res, next) => {
  try {
    const rows = await prisma.vendor.findMany({
      where: { companyId: req.user.companyId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    res.json({ categories: rows.map((r) => r.category).filter(Boolean) });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  name:             z.string().min(1),
  category:         z.string().min(1),
  contact:          z.string().optional().nullable(),
  phone:            z.string().optional().nullable(),
  unitPrice:        z.number().nonnegative().optional().nullable(),
  unit:             z.string().optional().nullable(),
  bankAccount:      z.string().optional().nullable(),
  defaultMeal:      z.number().nonnegative().optional().nullable(),
  defaultTransport: z.number().nonnegative().optional().nullable(),
  memo:             z.string().optional().nullable(),
});

router.post('/', requireRole('OWNER', 'DESIGNER'), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const vendor = await prisma.vendor.create({
      data: {
        companyId:        req.user.companyId,
        name:             data.name.trim(),
        category:         data.category.trim(),
        contact:          data.contact?.trim() || null,
        phone:            data.phone?.trim() || null,
        unitPrice:        data.unitPrice ?? null,
        unit:             data.unit?.trim() || null,
        bankAccount:      data.bankAccount?.trim() || null,
        defaultMeal:      data.defaultMeal ?? null,
        defaultTransport: data.defaultTransport ?? null,
        memo:             data.memo?.trim() || null,
      },
    });
    res.status(201).json({ vendor });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const updateSchema = createSchema.partial();

router.patch('/:id', requireRole('OWNER', 'DESIGNER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateSchema.parse(req.body || {});

    const existing = await prisma.vendor.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: '협력업체를 찾을 수 없습니다' });

    const updateData = {};
    if (data.name             !== undefined) updateData.name             = data.name.trim();
    if (data.category         !== undefined) updateData.category         = data.category.trim();
    if (data.contact          !== undefined) updateData.contact          = data.contact?.trim() || null;
    if (data.phone            !== undefined) updateData.phone            = data.phone?.trim() || null;
    if (data.unitPrice        !== undefined) updateData.unitPrice        = data.unitPrice ?? null;
    if (data.unit             !== undefined) updateData.unit             = data.unit?.trim() || null;
    if (data.bankAccount      !== undefined) updateData.bankAccount      = data.bankAccount?.trim() || null;
    if (data.defaultMeal      !== undefined) updateData.defaultMeal      = data.defaultMeal ?? null;
    if (data.defaultTransport !== undefined) updateData.defaultTransport = data.defaultTransport ?? null;
    if (data.memo             !== undefined) updateData.memo             = data.memo?.trim() || null;

    const vendor = await prisma.vendor.update({ where: { id }, data: updateData });
    res.json({ vendor });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

router.delete('/:id', requireRole('OWNER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.vendor.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: '협력업체를 찾을 수 없습니다' });

    await prisma.vendor.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================
// 시공팀 연동 (2026-05-17 Step 4 정정)
// 새 시공팀 초대는 회사 단위(/api/team/crew-invitations)로 이전됨.
// 여기엔 "기존 시공팀 연결"(목공 3:1 케이스)과 "연결 해제"만 남김.
// ============================================

// POST /api/vendors/:id/link-crew — 이미 가입된 시공팀 검색·연결 (목공팀 케이스: 추가 Vendor를 같은 반장에 묶기)
// body: { email?, nickname? } — 하나 입력
const linkCrewSchema = z.object({
  email: z.string().email().optional(),
  nickname: z.string().min(1).optional(),
}).refine((d) => d.email || d.nickname, { message: 'email 또는 nickname 필수' });

router.post('/:id/link-crew', requireRole('OWNER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = linkCrewSchema.parse(req.body);

    const existing = await prisma.vendor.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: '협력업체를 찾을 수 없습니다' });
    if (existing.linkedCrewUserId) {
      return res.status(409).json({ error: '이미 시공팀이 연결되어 있습니다' });
    }

    const where = data.email
      ? { email: data.email.trim().toLowerCase() }
      : { nickname: data.nickname.trim() };
    const crew = await prisma.user.findUnique({
      where,
      select: { id: true, name: true, nickname: true, email: true, accountType: true },
    });
    if (!crew) return res.status(404).json({ error: '시공팀 계정을 찾을 수 없습니다' });
    if (crew.accountType !== 'CREW') {
      return res.status(400).json({ error: '시공팀 계정이 아닙니다' });
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        linkedCrewUserId: crew.id,
        crewInviteToken: null,
        crewInviteSentAt: null,
        crewInviteExpiresAt: null,
      },
      include: { linkedCrew: { select: { id: true, name: true, nickname: true, email: true } } },
    });

    audit(req, 'vendor.crew-link', { targetType: 'VENDOR', targetId: id, metadata: { crewUserId: crew.id } });
    res.json({ vendor });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// DELETE /api/vendors/:id/crew-link — 시공팀 연결 해제 (또는 만료된 초대 토큰 폐기)
router.delete('/:id/crew-link', requireRole('OWNER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.vendor.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: '협력업체를 찾을 수 없습니다' });

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        linkedCrewUserId: null,
        crewInviteToken: null,
        crewInviteSentAt: null,
        crewInviteExpiresAt: null,
      },
    });

    audit(req, 'vendor.crew-unlink', { targetType: 'VENDOR', targetId: id });
    res.json({ vendor });
  } catch (e) { next(e); }
});

module.exports = router;
