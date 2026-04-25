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
  // 시작일/마감일 — 프로젝트 캘린더의 범위. 필수
  startDate: z.string().min(1, '시작일은 필수입니다'),
  expectedEndDate: z.string().min(1, '마감일은 필수입니다'),
  doorPassword: z.string().optional().nullable(),
  siteNotes: z.string().optional().nullable(),
  area: z.number().optional().nullable(),
  memo: z.string().optional().nullable(),
}).refine(
  (d) => new Date(d.startDate) <= new Date(d.expectedEndDate),
  { message: '마감일은 시작일과 같거나 그 이후여야 합니다', path: ['expectedEndDate'] }
);

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
        startDate: new Date(data.startDate),
        expectedEndDate: new Date(data.expectedEndDate),
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

// ============================================
// 시연용 샘플 프로젝트 — 모든 기능을 한눈에 확인할 수 있도록
// 프로젝트 + 견적(라인포함) + 일정(다양한 카테고리) + 마감재(미정/확정/잠금/가전)
// + 발주(자동생성, 일부 ORDERED) + 메모 일괄 생성
// ============================================
router.post('/_seed-sample', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };
    const isoTag = today.toISOString().slice(5, 16).replace(/[-:T]/g, '');

    const project = await prisma.$transaction(async (tx) => {
      // 1) 프로젝트
      const p = await tx.project.create({
        data: {
          companyId: req.user.companyId,
          createdById: req.user.id,
          name: `[시연] 역삼동 OO아파트 102동 503호 (${isoTag})`,
          customerName: '김고객',
          customerPhone: '010-1234-5678',
          siteAddress: '서울 강남구 역삼동 123-45 OO아파트 102동 503호',
          startDate: addDays(0),
          expectedEndDate: addDays(35),
          status: 'IN_PROGRESS',
          doorPassword: '1234*',
          area: 32,
          siteNotes: '주차 힘듦 (단지 입구 도보 이동)\n엘리베이터 09:00-18:00만 사용 가능\n공용부 도배 보수 추가 협의 필요',
          memo: null,
        },
      });

      // 2) 일정 — 다양한 공정 + 데드라인 시뮬용 시점
      const schedules = [
        { d: 1,  cat: '철거', content: '거실/주방 철거' },
        { d: 3,  cat: '설비', content: '욕실 방수 + 배관 작업' }, // 가까움
        { d: 5,  cat: '전기', content: '콘센트 위치 변경' },
        { d: 7,  cat: '목공', content: '안방 붙박이장 / 거실 아트월' }, // D-3
        { d: 10, cat: '타일', content: '욕실 + 주방 타일 시공' },
        { d: 12, cat: '도배', content: '전체 도배' },
        { d: 14, cat: '도장', content: '베란다 + 몰딩 도장' },
        { d: 15, cat: '필름', content: '문/문틀 필름 래핑' },
        { d: 17, cat: '가구', content: '가구 입고 + 설치' },
        { d: 20, cat: '가전', content: '냉장고/세탁기 입고' },
        { d: 28, cat: '입주', content: '준공 청소 + 점검' },
      ];
      for (const s of schedules) {
        await tx.dailyScheduleEntry.create({
          data: {
            projectId: p.id,
            date: addDays(s.d),
            category: s.cat,
            content: s.content,
            createdById: req.user.id,
            updatedById: req.user.id,
            orderIndex: 0,
          },
        });
      }

      // 3) 간편 견적 — 1차
      const quote = await tx.simpleQuote.create({
        data: {
          projectId: p.id,
          title: '1차',
          status: 'ACCEPTED',
          quoteDate: today,
          supplierName: '리플레이스 디자인',
          supplierRegNo: '540-69-00510',
          supplierOwner: '김봉기',
          supplierAddress: '강원도 춘천시 칠전동 1길 5-18 1층',
          supplierTel: '010-9982-6115',
          supplierEmail: 'replace-design@naver.com',
          clientName: '김고객',
          projectName: '역삼동 OO아파트 502호 인테리어',
          designFeeRate: 10,
          vatRate: 0,
          roundAdjustment: 0,
          templateKey: 'classic',
          footerNotes: '※ 현금영수증 및 세금계산서 발행 시 부가세(10%) 별도이며 견적 외 공사는 추가금이 발생됩니다.',
        },
      });
      const quoteLines = [
        { item: '철거', amt: 2_000_000, notes: '기존 마감재 철거 + 폐기물' },
        { item: '설비', amt: 3_000_000, notes: '욕실 방수 + 배관' },
        { item: '전기', amt: 2_500_000, notes: '콘센트 이동 + LED 조명' },
        { item: '목공', amt: 7_000_000, notes: '간살 벽체 + 붙박이장 + 아트월' },
        { item: '타일', amt: 2_500_000, notes: '욕실/주방 600각 포세린' },
        { item: '도배', amt: 2_000_000, notes: '베스띠 디아 회벽크림화이트' },
        { item: '도장', amt: 1_500_000, notes: '베란다/몰딩 도장' },
        { item: '필름', amt: 1_800_000, notes: '문/문틀 PS170' },
        { item: '가구', amt: 5_000_000, notes: '주방가구/신발장/거울장' },
        { item: '가전', amt: 8_000_000, notes: '빌트인 가전 일체' },
      ];
      let qLineIdx = 0;
      let qSubtotal = 0;
      for (const ql of quoteLines) {
        const amount = ql.amt;
        qSubtotal += amount;
        await tx.simpleQuoteLine.create({
          data: {
            quoteId: quote.id,
            orderIndex: qLineIdx++,
            isGroup: false,
            isGroupEnd: false,
            itemName: ql.item,
            quantity: 1,
            unit: '식',
            unitPrice: amount,
            amount,
            notes: ql.notes,
          },
        });
      }
      const designFee = Math.round(qSubtotal * 0.10);
      await tx.simpleQuote.update({
        where: { id: quote.id },
        data: {
          subtotal: qSubtotal,
          designFeeAmount: designFee,
          vatAmount: 0,
          total: qSubtotal + designFee,
        },
      });

      // 4) 마감재 — 그룹별 다양한 status (일부 미정 → 데드라인 임박 경고 발현)
      const materialPlan = [
        { group: '철거', kind: 'FINISH', items: [
          { name: '폐기물 처리', brand: '대형 폐기물 (관리실 협의)', qty: '1식', status: 'CONFIRMED' },
        ]},
        { group: '목공', kind: 'FINISH', items: [
          { name: '도어', brand: '영림 9미리 문선 PS170', qty: '6개', memo: '안방 -8mm', status: 'CONFIRMED' },
          { name: '도어 손잡이', brand: '도무스 D711NI 니켈 무광', qty: '6개', status: 'CONFIRMED' },
          { name: '아트월', brand: '대리석 매립 (TV 65인치)', qty: '1식', status: 'UNDECIDED' },
          { name: '걸레받이', brand: '영림 PS170', qty: '40m', status: 'UNDECIDED' },
          { name: '몰딩', brand: '마이너스 몰딩', qty: '40m', status: 'UNDECIDED' },
        ]},
        { group: '타일', kind: 'FINISH', items: [
          { name: '욕실 벽 타일', brand: '아이솔 베이지 600각', qty: '1식', status: 'UNDECIDED' },
          { name: '욕실 바닥 타일', brand: '아이솔 베이지 600각', qty: '1식', status: 'UNDECIDED' },
          { name: '주방 벽 타일', brand: '이모션 화이트 300각', qty: '1식', status: 'UNDECIDED' },
        ]},
        { group: '도배', kind: 'FINISH', items: [
          { name: '거실/안방 벽지', brand: 'LX 베스띠 디아 회벽크림화이트', qty: '1식', status: 'CONFIRMED' },
          { name: '천장지', brand: 'LX 화이트 무지', qty: '1식', status: 'CONFIRMED' },
        ]},
        { group: '주방', kind: 'APPLIANCE', items: [
          { name: '냉장고', brand: 'BESPOKE 4도어 871L / RF85R9013S8', size: '908 × 930 × 1853', installed: true, memo: '키친핏, 좌측 개폐', status: 'CONFIRMED' },
          { name: '식기세척기', brand: 'LG 디오스 DUE6BGL1E', size: '598 × 567 × 815', installed: true, memo: '빌트인 (걸레받이 150mm 절단)', status: 'UNDECIDED' },
          { name: '인덕션', brand: 'LG BEI3QKHLOE', size: '580 × 520 × 59', installed: true, memo: '타공: 560 × 480 × 65', status: 'UNDECIDED' },
          { name: '오븐', brand: '미정', size: '', installed: false, memo: '빌트인 여부 검토 중', status: 'UNDECIDED' },
        ]},
      ];
      let matOrder = 0;
      const matIdsToConfirm = [];
      for (const grp of materialPlan) {
        for (const it of grp.items) {
          const m = await tx.material.create({
            data: {
              projectId: p.id,
              kind: grp.kind,
              spaceGroup: grp.group,
              itemName: it.name,
              brand: it.brand || null,
              unit: it.qty || null,
              quantity: null,
              size: it.size || null,
              installed: it.installed === true ? true : it.installed === false ? false : null,
              memo: it.memo || null,
              status: it.status,
              orderIndex: matOrder++,
            },
          });
          if (it.status === 'CONFIRMED') matIdsToConfirm.push(m.id);
        }
      }

      // 5) 발주 — 확정된 마감재의 PO 자동 생성 (mat에서 status가 CONFIRMED인 것)
      // 일부는 ORDERED, RECEIVED로 시뮬
      let poIdx = 0;
      for (const mid of matIdsToConfirm) {
        const m = await tx.material.findUnique({ where: { id: mid } });
        const itemName = `${m.spaceGroup} · ${m.itemName}`;
        const parts = [];
        if (m.brand) parts.push(m.brand);
        if (m.size) parts.push(m.size);
        // status: 처음 2개는 ORDERED + vendor, 다음 1개는 RECEIVED, 나머지 PENDING
        let status = 'PENDING';
        let vendor = null;
        if (poIdx === 0) { status = 'ORDERED'; vendor = '도무스코리아'; }
        else if (poIdx === 1) { status = 'RECEIVED'; vendor = '도무스코리아'; }
        else if (poIdx === 2) { status = 'ORDERED'; vendor = 'LX하우시스'; }
        await tx.purchaseOrder.create({
          data: {
            projectId: p.id,
            materialId: m.id,
            itemName,
            spec: parts.join(' / ') || null,
            unit: m.unit,
            vendor,
            status,
            orderedAt: status === 'ORDERED' || status === 'RECEIVED' ? today : null,
            receivedAt: status === 'RECEIVED' ? today : null,
          },
        });
        poIdx++;
      }

      // 6) 메모 — 2개
      await tx.projectMemo.create({
        data: {
          projectId: p.id,
          title: '목공 추가 발주',
          content: '각재 30단\n합판 5장 (B등급)\n타카 핀 추가 1박스',
          orderIndex: 0,
        },
      });
      await tx.projectMemo.create({
        data: {
          projectId: p.id,
          title: '현장 메모',
          content: '안방 천장 누수 흔적 → 도배 전 보강 필요\n화장실 환풍기 위치 이전 검토\n분배기 다용도실 천장에 있음 (사다리 필수)',
          orderIndex: 1,
        },
      });

      return p;
    }, { timeout: 30000 });

    res.status(201).json({ project });
  } catch (e) {
    console.error('[seed-sample]', e);
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
  // 수정 시에도 빈 값 허용 X (요구사항: 시작/마감은 항상 존재)
  startDate: z.string().min(1).optional(),
  expectedEndDate: z.string().min(1).optional(),
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

    // 업데이트 후 시작/마감 순서 검증
    const newStart = data.startDate !== undefined ? data.startDate : existing.startDate?.toISOString().slice(0, 10);
    const newEnd = data.expectedEndDate !== undefined ? data.expectedEndDate : existing.expectedEndDate?.toISOString().slice(0, 10);
    if (newStart && newEnd && new Date(newStart) > new Date(newEnd)) {
      return res.status(400).json({ error: '마감일은 시작일과 같거나 그 이후여야 합니다' });
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.customerName !== undefined && { customerName: data.customerName.trim() }),
        ...(data.customerPhone !== undefined && { customerPhone: data.customerPhone || null }),
        ...(data.siteAddress !== undefined && { siteAddress: data.siteAddress.trim() }),
        ...(data.contractAmount !== undefined && { contractAmount: data.contractAmount }),
        ...(data.startDate !== undefined && {
          startDate: new Date(data.startDate),
        }),
        ...(data.expectedEndDate !== undefined && {
          expectedEndDate: new Date(data.expectedEndDate),
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
