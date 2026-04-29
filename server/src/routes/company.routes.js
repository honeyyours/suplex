const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired, requireRole } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

const RATE_KEYS = [
  'rateIndirectMaterial', 'rateIndirectLabor', 'rateIndustrialAcc',
  'rateEmployment', 'rateRetirement', 'rateSafety', 'rateOtherExpense',
  'rateMisc', 'rateGeneralAdmin', 'rateSupervision', 'rateDesign', 'rateVat',
];

// GET /api/company  — 내 회사 정보 + 견적 비율
// 명시 select로 phaseLabels 제외 (별도 라우트 GET /api/phases/labels에서 관리).
// omit 옵션은 일부 Railway 빌드 환경에서 인식 안 되는 이슈가 있어 select로 교체 (2026-04-29).
router.get('/', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        email: true,
        bizNumber: true,
        representative: true,
        logoUrl: true,
        hideExpenses: true,
        rateIndirectMaterial: true,
        rateIndirectLabor: true,
        rateIndustrialAcc: true,
        rateEmployment: true,
        rateRetirement: true,
        rateSafety: true,
        rateOtherExpense: true,
        rateMisc: true,
        rateGeneralAdmin: true,
        rateSupervision: true,
        rateDesign: true,
        rateVat: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json({ company });
  } catch (e) { next(e); }
});

const rateField = z.number().min(0).max(100);
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  bizNumber: z.string().optional().nullable(),
  representative: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  hideExpenses: z.boolean().optional(),
  ...Object.fromEntries(RATE_KEYS.map((k) => [k, rateField.optional()])),
});

// PATCH /api/company  — OWNER만
router.patch('/', requireRole('OWNER'), async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body || {});
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.bizNumber !== undefined) updateData.bizNumber = data.bizNumber?.trim() || null;
    if (data.representative !== undefined) updateData.representative = data.representative?.trim() || null;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl?.trim() || null;
    if (data.hideExpenses !== undefined) updateData.hideExpenses = data.hideExpenses;
    for (const k of RATE_KEYS) if (data[k] !== undefined) updateData[k] = data[k];

    const company = await prisma.company.update({
      where: { id: req.user.companyId },
      data: updateData,
    });
    res.json({ company });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

module.exports = router;
