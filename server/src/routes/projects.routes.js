const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

router.use(authRequired);

// GET /api/projects
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const projects = await prisma.project.findMany({
      where: {
        companyId: req.user.companyId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ projects });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  name: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().optional().nullable(),
  siteAddress: z.string().min(1),
  contractAmount: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  expectedEndDate: z.string().optional().nullable(),
  doorPassword: z.string().optional().nullable(),
  siteNotes: z.string().optional().nullable(),
  area: z.number().optional().nullable(),
  memo: z.string().optional().nullable(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        name: data.name.trim(),
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone || null,
        siteAddress: data.siteAddress.trim(),
        contractAmount: data.contractAmount ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
        doorPassword: data.doorPassword || null,
        siteNotes: data.siteNotes || null,
        area: data.area ?? null,
        memo: data.memo || null,
        companyId: req.user.companyId,
        createdById: req.user.id,
      },
    });
    res.status(201).json({ project });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json({ project });
  } catch (e) {
    next(e);
  }
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().optional().nullable(),
  siteAddress: z.string().min(1).optional(),
  contractAmount: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  expectedEndDate: z.string().optional().nullable(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  doorPassword: z.string().optional().nullable(),
  siteNotes: z.string().optional().nullable(),
  area: z.number().optional().nullable(),
  memo: z.string().optional().nullable(),
});

router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.customerName !== undefined && { customerName: data.customerName.trim() }),
        ...(data.customerPhone !== undefined && { customerPhone: data.customerPhone || null }),
        ...(data.siteAddress !== undefined && { siteAddress: data.siteAddress.trim() }),
        ...(data.contractAmount !== undefined && { contractAmount: data.contractAmount }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.expectedEndDate !== undefined && {
          expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.doorPassword !== undefined && { doorPassword: data.doorPassword || null }),
        ...(data.siteNotes !== undefined && { siteNotes: data.siteNotes || null }),
        ...(data.area !== undefined && { area: data.area }),
        ...(data.memo !== undefined && { memo: data.memo || null }),
      },
    });
    res.json({ project: updated });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
