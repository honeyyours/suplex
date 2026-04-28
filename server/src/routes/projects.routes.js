const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { syncAdvicesFromPhase } = require('../services/checklistAutoSeed');
const { STANDARD_ADVICES } = require('../services/standardPhaseAdvices');
const { buildSeedRows: buildPhaseKeywordSeedRows } = require('../services/phaseKeywordSeed');
const { invalidateCache: invalidatePhaseCache } = require('../services/phaseDetect');
const { STANDARD_PHASES, normalizePhase } = require('../services/phases');

const router = express.Router();

router.use(authRequired);

// ============================================
// GET /api/projects/:id/process-overview
// 25개 표준 공정(척추) × 4축(견적·마감재·일정·발주) 통합 뷰
// 메모리 핵심결정 "공정=척추" 시각적 구현체. 베타 7-A.
// ============================================
router.get('/:id/process-overview', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: req.user.companyId },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // 견적 (ACCEPTED 우선, 없으면 가장 최근 updatedAt)
    const quotes = await prisma.simpleQuote.findMany({
      where: { projectId },
      include: { lines: { orderBy: { orderIndex: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    const primaryQuote =
      quotes.find((q) => q.status === 'ACCEPTED') || quotes[0] || null;

    // 마감재 (FINISH만 — APPLIANCE는 spaceGroup이 공간명이라 phase 매칭 X)
    const materials = await prisma.material.findMany({
      where: { projectId, kind: 'FINISH' },
      select: { id: true, spaceGroup: true, status: true, locked: true },
    });

    // 일정
    const scheduleEntries = await prisma.dailyScheduleEntry.findMany({
      where: { projectId },
      select: { id: true, content: true, category: true, date: true },
      orderBy: { date: 'asc' },
    });

    // 발주
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { projectId },
      select: {
        id: true, status: true, materialChangedAt: true,
        material: { select: { spaceGroup: true } },
      },
    });

    // phase별 집계 — Map<phase, {quote, material, schedule, order}>
    const map = new Map();
    function ensure(phase) {
      if (!map.has(phase)) {
        map.set(phase, {
          phase,
          quote:    { lineCount: 0, total: 0 },
          material: { total: 0, confirmed: 0, undecided: 0 },
          schedule: { firstDate: null, lastDate: null, count: 0 },
          order:    { pending: 0, ordered: 0, received: 0, cancelled: 0, changedFlag: 0 },
        });
      }
      return map.get(phase);
    }

    // 견적 라인 집계 — sendToMaterials와 동일 패턴 (normalizePhase)
    if (primaryQuote) {
      // isGroup=true 헤더 안 라인은 헤더 itemName 기준
      // isGroup=false 외부 라인은 라인 itemName 자체 기준
      let currentHeader = null;
      for (const l of primaryQuote.lines) {
        if (l.isGroup && l.isGroupEnd) { currentHeader = null; continue; }
        if (l.isGroup) {
          currentHeader = l.itemName ? normalizePhase(l.itemName).label : null;
          continue;
        }
        const phase = currentHeader || (l.itemName ? normalizePhase(l.itemName).label : null);
        if (!phase) continue;
        const e = ensure(phase);
        e.quote.lineCount++;
        e.quote.total += Number(l.amount) || 0;
      }
    }

    // 마감재 집계
    for (const m of materials) {
      if (!m.spaceGroup) continue;
      const phase = normalizePhase(m.spaceGroup).label;
      const e = ensure(phase);
      e.material.total++;
      if (['CONFIRMED', 'CHANGED', 'REUSED'].includes(m.status) || m.locked) {
        e.material.confirmed++;
      } else if (m.status === 'UNDECIDED' || m.status === 'REVIEWING') {
        e.material.undecided++;
      }
    }

    // 일정 집계 (category 기준 — 자유 텍스트면 normalizePhase로)
    for (const s of scheduleEntries) {
      if (!s.category) continue;
      const phase = normalizePhase(s.category).label;
      if (phase === '기타') continue; // 사용자 정책: 일정에서 '기타'는 공종으로 표시 X
      const e = ensure(phase);
      e.schedule.count++;
      const d = s.date ? new Date(s.date) : null;
      if (d) {
        if (!e.schedule.firstDate || d < new Date(e.schedule.firstDate)) e.schedule.firstDate = d.toISOString().slice(0, 10);
        if (!e.schedule.lastDate || d > new Date(e.schedule.lastDate)) e.schedule.lastDate = d.toISOString().slice(0, 10);
      }
    }

    // 발주 집계
    for (const po of purchaseOrders) {
      const sg = po.material?.spaceGroup;
      if (!sg) continue;
      const phase = normalizePhase(sg).label;
      const e = ensure(phase);
      const k = (po.status || '').toLowerCase();
      if (k === 'pending') e.order.pending++;
      else if (k === 'ordered') e.order.ordered++;
      else if (k === 'received') e.order.received++;
      else if (k === 'cancelled') e.order.cancelled++;
      if (po.materialChangedAt) e.order.changedFlag++;
    }

    // 25개 표준 + 추가로 등장한 비표준(=기타) 정렬
    const standardOrder = new Map(STANDARD_PHASES.map((p) => [p.label, p.order]));
    const phases = Array.from(map.values()).map((row) => {
      // 리스크 배지 자동 계산
      const risks = [];
      const today = new Date();
      const firstDate = row.schedule.firstDate ? new Date(row.schedule.firstDate) : null;
      if (firstDate) {
        const days = Math.floor((firstDate - today) / (24 * 60 * 60 * 1000));
        if (days >= 0 && days <= 3 && row.material.undecided > 0) {
          risks.push({ level: 'critical', text: `🚨 D-${days} 마감재 미확정 ${row.material.undecided}건` });
        } else if (days < 0 && row.material.undecided > 0) {
          risks.push({ level: 'critical', text: `🚨 일정 시작됨 / 마감재 미확정 ${row.material.undecided}건` });
        }
      }
      if (row.quote.lineCount > 0 && row.material.total === 0) {
        risks.push({ level: 'warning', text: `⚠️ 견적 ${row.quote.lineCount}라인 / 마감재 0개 (매칭 누락)` });
      }
      if (row.order.pending > 0) {
        risks.push({ level: 'info', text: `🟡 발주 대기 ${row.order.pending}건` });
      }
      if (row.order.changedFlag > 0) {
        risks.push({ level: 'warning', text: `⚠️ 발주 후 마감재 변경 ${row.order.changedFlag}건` });
      }
      return { ...row, risks, order_index: standardOrder.get(row.phase) ?? 999 };
    });
    phases.sort((a, b) => a.order_index - b.order_index);

    res.json({
      project: {
        id: project.id, name: project.name,
        startDate: project.startDate, expectedEndDate: project.expectedEndDate,
        contractAmount: project.contractAmount, status: project.status,
      },
      quote: primaryQuote ? {
        id: primaryQuote.id, title: primaryQuote.title, status: primaryQuote.status,
      } : null,
      phases,
      // 표시 토글용 — 표준 25개 전체
      standardPhases: STANDARD_PHASES.map((p) => ({ key: p.key, label: p.label, order: p.order })),
    });
  } catch (e) { next(e); }
});

// ============================================
// GET /api/projects/:id/phase-detail?phase=...
// 단일 공정의 4축 상세 — 공정 현황 페이지 행 클릭 시 WorkContextDrawer에서 사용
// ============================================
router.get('/:id/phase-detail', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const phase = String(req.query.phase || '').trim();
    if (!phase) return res.status(400).json({ error: 'phase required' });

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: req.user.companyId },
      select: { id: true, name: true },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // 견적: ACCEPTED 우선, 없으면 최신
    const quotes = await prisma.simpleQuote.findMany({
      where: { projectId },
      include: { lines: { orderBy: { orderIndex: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    const primaryQuote =
      quotes.find((q) => q.status === 'ACCEPTED') || quotes[0] || null;

    // 견적 라인 — 그 phase 그룹 또는 평면 라인 itemName이 phase에 정규화 매칭
    const quoteLines = [];
    if (primaryQuote) {
      let inHeader = false;
      let currentMatch = false;
      for (const l of primaryQuote.lines) {
        if (l.isGroup && l.isGroupEnd) { inHeader = false; currentMatch = false; continue; }
        if (l.isGroup) {
          inHeader = true;
          const headerPhase = l.itemName ? normalizePhase(l.itemName).label : null;
          // 매핑 표준이면 표준 / 매핑 실패(OTHER)면 원본
          const headerKey = (headerPhase === '기타' && l.itemName) ? l.itemName.trim() : headerPhase;
          currentMatch = headerKey === phase;
          continue;
        }
        if (inHeader) {
          if (currentMatch) quoteLines.push(l);
        } else {
          // 평면 라인 — itemName 자체로 매칭
          const linePhase = l.itemName ? normalizePhase(l.itemName).label : null;
          const lineKey = (linePhase === '기타' && l.itemName) ? l.itemName.trim() : linePhase;
          if (lineKey === phase) quoteLines.push(l);
        }
      }
    }

    // 마감재 — spaceGroup === phase
    const materials = await prisma.material.findMany({
      where: { projectId, spaceGroup: phase, kind: 'FINISH' },
      orderBy: { orderIndex: 'asc' },
    });

    // 일정 — category가 phase에 매칭되는 것
    const allEntries = await prisma.dailyScheduleEntry.findMany({
      where: { projectId },
      orderBy: { date: 'asc' },
      select: { id: true, content: true, category: true, date: true, isFixed: true },
    });
    const scheduleEntries = allEntries.filter((s) => {
      if (!s.category) return false;
      const sp = normalizePhase(s.category).label;
      const key = sp === '기타' ? s.category.trim() : sp;
      return key === phase;
    });

    // 발주 — material.spaceGroup === phase
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        projectId,
        material: { spaceGroup: phase },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        material: { select: { id: true, itemName: true, brand: true, productName: true, spec: true } },
      },
    });

    res.json({
      project,
      phase,
      quote: primaryQuote ? {
        id: primaryQuote.id, title: primaryQuote.title, status: primaryQuote.status,
        lines: quoteLines,
      } : null,
      materials,
      scheduleEntries,
      purchaseOrders,
    });
  } catch (e) { next(e); }
});

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
  contractVatRate: z.number().min(0).max(100).optional().nullable(),
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
        contractVatRate: data.contractVatRate ?? null,
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
      // 0-a) 공종 자동 인식 키워드 시드 — 회사에 0개일 때만 (덮어쓰기 X)
      const kwCount = await tx.phaseKeywordRule.count({ where: { companyId: req.user.companyId } });
      if (kwCount === 0) {
        const rows = buildPhaseKeywordSeedRows().map((r) => ({ ...r, companyId: req.user.companyId }));
        await tx.phaseKeywordRule.createMany({ data: rows, skipDuplicates: true });
      }

      // 0-b) 표준 어드바이스 시드 — 회사에 없으면 추가 (이미 있으면 그대로)
      for (const a of STANDARD_ADVICES) {
        const existing = await tx.phaseAdvice.findFirst({
          where: { companyId: req.user.companyId, phase: a.phase, daysBefore: a.daysBefore, title: a.title },
        });
        if (!existing) {
          await tx.phaseAdvice.create({
            data: { companyId: req.user.companyId, ...a, active: true },
          });
        }
      }

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
        const entryDate = addDays(s.d);
        await tx.dailyScheduleEntry.create({
          data: {
            projectId: p.id,
            date: entryDate,
            category: s.cat,
            content: s.content,
            createdById: req.user.id,
            updatedById: req.user.id,
            orderIndex: 0,
          },
        });
        // 일정 entry 생성 시 어드바이스 자동 적용 (체크리스트 자동 등록)
        await syncAdvicesFromPhase(tx, {
          projectId: p.id,
          companyId: req.user.companyId,
          phase: s.cat,
          scheduleDate: entryDate,
          userId: req.user.id,
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

      // 6) 메모 — 6개 태그 모두 시드 (데모 설득력 ↑)
      const memos = [
        { tag: '일반',     title: '내일 견적 회의', content: '오전 10시 견적서 검토 회의\n자료는 메일로 미리 공유' },
        { tag: '거래처',   title: '가구 코리아싱크', content: '상판 고정 잘 안함. 다음부터 강조 필요' },
        { tag: '거래처',   title: '도배 사장님 평가', content: '도배사장님한테 장판까지 맡겼더니 장판 퀄리티 떨어짐. 다음부터 다른 시공팀' },
        { tag: 'A/S',      title: '도배지 이염', content: '안방 화장대 옆벽 도배지 이염 발생\n재시공 조치 (시공팀 부담)' },
        { tag: '피드백',   title: '마루 모델 좋음', content: '마루 모델 생각보다 예쁨. 화이트우드 톤에 적격\n다음 견적에 추천' },
        { tag: '자재발주', title: '목공 자재 발주 정리', content: '· 합판 18T x 20장\n· 각재 30x40 x 50개\n· 타카 핀 1박스' },
        { tag: '현장 환경', title: '콘센트 호환 이슈', content: '콘센트 치수가 일반적이지 않음. 특정 모델만 호환됨\n다음에 같은 현장 들어올 때 주의' },
      ];
      let memoIdx = 0;
      for (const m of memos) {
        await tx.projectMemo.create({
          data: {
            projectId: p.id,
            tag: m.tag,
            title: m.title,
            content: m.content,
            orderIndex: memoIdx++,
          },
        });
      }

      // 7) 현장 보고 — 2건 시드 (카톡 메시지 자동 생성 데모용)
      const reportSeed = [
        { category: '철거', progress: 100, workerCount: 3, caption: '철거 완료, 폐기물 반출 끝',           daysAgo: 5 },
        { category: '목공', progress: 70,  workerCount: 2, caption: '거실/안방 마감 끝, 주방 진행 중',     daysAgo: 1 },
      ];
      for (const r of reportSeed) {
        const reportDate = new Date(today);
        reportDate.setDate(reportDate.getDate() - r.daysAgo);
        await tx.dailyReport.create({
          data: {
            projectId: p.id,
            authorId: req.user.id,
            reportDate,
            category: r.category,
            progress: r.progress,
            workerCount: r.workerCount,
            caption: r.caption,
          },
        });
      }

      return p;
    }, { timeout: 30000 });

    // 트랜잭션 후 키워드 캐시 무효화 (다음 일정 추가 시 새 룰 적용)
    invalidatePhaseCache(req.user.companyId);

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
  contractVatRate: z.number().min(0).max(100).optional().nullable(),
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
        ...(data.contractVatRate !== undefined && { contractVatRate: data.contractVatRate }),
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
