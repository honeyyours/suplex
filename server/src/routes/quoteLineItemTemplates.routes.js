const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

const WORK_TYPES = [
  'START', 'DEMOLITION', 'PLUMBING', 'GAS', 'ELECTRIC', 'FIRE',
  'CARPENTRY', 'TILE', 'BATHROOM', 'PAINTING', 'FILM', 'WALLPAPER',
  'FURNITURE', 'FLOORING', 'FINISHING',
];

// PDF 견적서 (현진에버빌 3차) 기준 기본 템플릿
function buildSeedRows() {
  // [workType, itemName, spec, unit, materialPrice, laborPrice, expensePrice]
  const data = [
    // 공사시작
    ['START', '현장 보양/송장가 표시', '', '식', 200000, 200000, 0],
    ['START', '공정 사진 관리', '사진 촬영·정리', '식', 45000, 35000, 0],

    // 철거
    ['DEMOLITION', '바닥 철거', '', 'm²', 0, 8170, 0],
    ['DEMOLITION', '타일 철거', '', 'm²', 0, 19400, 0],
    ['DEMOLITION', '타일 본드 제거', '', 'm²', 0, 50000, 0],
    ['DEMOLITION', '가구 철거 (문짝)', '', '식', 0, 47500, 0],
    ['DEMOLITION', '가구 철거 (붙박이)', '', '식', 0, 47500, 0],
    ['DEMOLITION', '도기 철거', '', '개', 0, 9000, 0],
    ['DEMOLITION', '폐기물 처리', '', 'm²', 0, 0, 11478],

    // 설비
    ['PLUMBING', '수도 배관 교체', '신규', 'm', 30000, 50000, 0],
    ['PLUMBING', '배관 마감', '', '식', 50000, 70000, 0],

    // 가스
    ['GAS', '도시가스 배관', '신규', 'm', 30000, 50000, 0],

    // 전기
    ['ELECTRIC', '내선전선 HIV 2.5SQ', '', 'm', 985, 1000, 0],
    ['ELECTRIC', '알전선 2.5SQ', '', 'm', 4500, 1300, 0],
    ['ELECTRIC', '전등 배선', '', 'm', 4500, 1500, 0],
    ['ELECTRIC', '콘센트 (일반)', '', '개', 4490, 6000, 0],
    ['ELECTRIC', '콘센트 (매입)', '', '개', 5000, 8700, 0],
    ['ELECTRIC', '와이드 스위치', '', '개', 5000, 3500, 0],
    ['ELECTRIC', 'LED 다운라이트 6인치', '', '개', 25000, 14000, 0],
    ['ELECTRIC', 'LED 다운라이트 4인치', '', '개', 12000, 14000, 0],
    ['ELECTRIC', '직부등', '', '개', 12700, 8000, 0],
    ['ELECTRIC', '펜던트 라이트', '매입 신설', '개', 28000, 10500, 0],
    ['ELECTRIC', '모듈러 (CAT.6)', '', '개', 10000, 6000, 0],
    ['ELECTRIC', 'TV 안테나 (디지털 호환)', '', '개', 10000, 6000, 0],

    // 소방
    ['FIRE', '화재 감지기', '정온식/차동식', '개', 8000, 9420, 0],

    // 목공
    ['CARPENTRY', 'TV 매립벽', '거실 TV 면체된', '개소', 250000, 400000, 0],
    ['CARPENTRY', '침실문 디자인 변경', '30단단 1식', '식', 539000, 726000, 0],
    ['CARPENTRY', '디자인 도어 (1식)', '', '식', 180000, 75000, 0],
    ['CARPENTRY', '도어 가공 (외벽)', '9mm 문언', '줄', 12000, 75000, 0],
    ['CARPENTRY', '목공 공구 사용료', '', '식', 1650000, 250000, 0],
    ['CARPENTRY', '목공 폐기물 (0.5톤)', '', '식', 0, 0, 350000],

    // 타일
    ['TILE', '바닥 600각 (주방)', '600각 포세린', 'm²', 32760, 36984, 0],
    ['TILE', '바닥 600각 (욕실)', '600각 포세린', 'm²', 32760, 39915, 0],
    ['TILE', '벽 600각 (욕실)', '600각 포세린', 'm²', 32760, 59317, 0],
    ['TILE', '부착작업', '시공 직접', '평', 13500, 13800, 0],
    ['TILE', '한터지', '기조', '식', 118200, 514933, 0],

    // 욕실
    ['BATHROOM', '양변기', '', '대', 306500, 47000, 0],
    ['BATHROOM', '세면대', '', '대', 30000, 30000, 0],
    ['BATHROOM', '수전 (욕실)', '', '구', 100000, 47300, 0],

    // 도장
    ['PAINTING', '벽 도장', '수성 페인트 2회', 'm²', 5000, 8000, 0],
    ['PAINTING', '천장 도장', '수성 페인트 2회', 'm²', 4500, 7500, 0],

    // 필름
    ['FILM', '도어 필름', '', 'm²', 75000, 1000, 0],
    ['FILM', '필름 시공', '점필주 안내', '평', 65000, 100000, 0],

    // 도배
    ['WALLPAPER', '벽 부장재', '실크부장재', 'm²', 19160, 4800, 0],
    ['WALLPAPER', '천 부장', '천부장', 'm²', 5460, 4800, 0],

    // 가구
    ['FURNITURE', '주방 상부장', '한솔 패트 무광 크림화이트 기준', 'm', 150000, 115000, 0],
    ['FURNITURE', '냉장고장', '한솔 패트 무광 크림화이트 기준', 'm', 220000, 163000, 0],
    ['FURNITURE', '신발장', '한솔 패트 무광 크림화이트 기준', 'm', 230000, 115000, 0],
    ['FURNITURE', '상판 (인조대리석)', '인조대리석', 'm', 140000, 206500, 0],
    ['FURNITURE', '가공 조명 삽입', '따내기, 덧대기', 'm', 60000, 27000, 0],
    ['FURNITURE', '싱크볼', '백조 860 기준', '개', 490000, 30000, 0],
    ['FURNITURE', '싱크수전', '거위목 수전', '구', 144000, 30000, 0],

    // 마루/장판
    ['FLOORING', '장판', '2.2T 장판', 'm²', 22000, 3500, 0],

    // 공사 마무리
    ['FINISHING', '마감 코킹', '마감재 조인트 전체 실리콘 코킹', 'm²', 670, 3330, 0],
    ['FINISHING', '입주 청소', '청소 인력 6인 기준', '식', 0, 650000, 0],
  ];

  return data.map((r, i) => ({
    workType: r[0],
    itemName: r[1],
    spec: r[2] || null,
    unit: r[3] || null,
    defaultQuantity: 1,
    defaultMaterialPrice: r[4],
    defaultLaborPrice: r[5],
    defaultExpensePrice: r[6],
    active: true,
    orderIndex: i,
  }));
}

// POST /api/quote-templates/bulk  — items 배열 일괄 추가 (CSV 가져오기에서 사용)
router.post('/bulk', async (req, res, next) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) return res.status(400).json({ error: 'items 배열 필요' });

    const rows = items
      .filter((it) => WORK_TYPES.includes(it.workType))
      .map((it, i) => ({
        companyId: req.user.companyId,
        workType: it.workType,
        itemName: String(it.itemName || '').trim() || '(이름없음)',
        spec: it.spec ? String(it.spec).trim() : null,
        unit: it.unit ? String(it.unit).trim() : null,
        defaultQuantity: Number(it.defaultQuantity) || 1,
        defaultMaterialPrice: Number(it.defaultMaterialPrice) || 0,
        defaultLaborPrice: Number(it.defaultLaborPrice) || 0,
        defaultExpensePrice: Number(it.defaultExpensePrice) || 0,
        active: true,
        orderIndex: typeof it.orderIndex === 'number' ? it.orderIndex : i,
      }));

    if (rows.length === 0) return res.status(400).json({ error: '유효한 항목이 없습니다 (workType 확인)' });
    const result = await prisma.quoteLineItemTemplate.createMany({ data: rows });
    res.status(201).json({ ok: true, created: result.count, skipped: items.length - rows.length });
  } catch (e) { next(e); }
});

// POST /api/quote-templates/seed  — PDF 양식 기준 기본 템플릿 일괄 시드
router.post('/seed', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const existing = await prisma.quoteLineItemTemplate.count({ where: { companyId } });
    if (existing > 0 && !req.body?.force) {
      return res.status(409).json({
        error: '이미 템플릿이 존재합니다. force:true 로 덮어쓸 수 있습니다',
        existing,
      });
    }
    if (req.body?.force && existing > 0) {
      await prisma.quoteLineItemTemplate.deleteMany({ where: { companyId } });
    }
    const rows = buildSeedRows().map((r) => ({ ...r, companyId }));
    const result = await prisma.quoteLineItemTemplate.createMany({ data: rows });
    res.status(201).json({ ok: true, created: result.count });
  } catch (e) { next(e); }
});

// GET /api/quote-templates?workType=ELECTRIC
router.get('/', async (req, res, next) => {
  try {
    const where = { companyId: req.user.companyId, active: true };
    if (req.query.workType && WORK_TYPES.includes(req.query.workType)) {
      where.workType = req.query.workType;
    }
    const templates = await prisma.quoteLineItemTemplate.findMany({
      where,
      orderBy: [{ workType: 'asc' }, { orderIndex: 'asc' }],
    });
    res.json({ templates });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  workType: z.enum(WORK_TYPES),
  itemName: z.string().min(1),
  spec: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  defaultQuantity: z.number().optional(),
  defaultMaterialPrice: z.number().optional(),
  defaultLaborPrice: z.number().optional(),
  defaultExpensePrice: z.number().optional(),
  active: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const tpl = await prisma.quoteLineItemTemplate.create({
      data: {
        companyId: req.user.companyId,
        workType: data.workType,
        itemName: data.itemName.trim(),
        spec: data.spec?.trim() || null,
        unit: data.unit?.trim() || null,
        defaultQuantity: data.defaultQuantity ?? 1,
        defaultMaterialPrice: data.defaultMaterialPrice ?? 0,
        defaultLaborPrice: data.defaultLaborPrice ?? 0,
        defaultExpensePrice: data.defaultExpensePrice ?? 0,
        active: data.active ?? true,
        orderIndex: data.orderIndex ?? 0,
      },
    });
    res.status(201).json({ template: tpl });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const updateSchema = createSchema.partial();

router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.quoteLineItemTemplate.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    const updateData = {};
    if (data.workType !== undefined) updateData.workType = data.workType;
    if (data.itemName !== undefined) updateData.itemName = data.itemName.trim();
    if (data.spec !== undefined) updateData.spec = data.spec?.trim() || null;
    if (data.unit !== undefined) updateData.unit = data.unit?.trim() || null;
    if (data.defaultQuantity !== undefined) updateData.defaultQuantity = data.defaultQuantity;
    if (data.defaultMaterialPrice !== undefined) updateData.defaultMaterialPrice = data.defaultMaterialPrice;
    if (data.defaultLaborPrice !== undefined) updateData.defaultLaborPrice = data.defaultLaborPrice;
    if (data.defaultExpensePrice !== undefined) updateData.defaultExpensePrice = data.defaultExpensePrice;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

    const tpl = await prisma.quoteLineItemTemplate.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json({ template: tpl });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.quoteLineItemTemplate.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    await prisma.quoteLineItemTemplate.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
