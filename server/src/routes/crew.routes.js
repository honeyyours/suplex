const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { audit } = require('../services/audit');

const router = express.Router();

// 시공팀(CREW) 전용 API — 회사 컨텍스트 X, 자기 정보·거래 회사·일정만.
// 일부 엔드포인트는 인증 X (초대 토큰 조회 — 가입 안 한 시공팀이 회사명을 미리 확인).
// routes/index.js에서 회사 가드(requireApprovedCompany) 우회 처리.

// ---- 인증 불필요 ----

// GET /api/crew/invitations/:token — 초대 토큰 검증 (회사 단위, 2026-05-17 정정).
// 시공팀이 링크 클릭했을 때 회사명 노출. 미가입자도 호출 가능(가입 결정 화면).
router.get('/invitations/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const invitation = await prisma.crewInvitation.findUnique({
      where: { token },
      select: {
        id: true,
        note: true,
        expiresAt: true,
        acceptedAt: true,
        company: { select: { id: true, name: true } },
      },
    });
    if (!invitation) return res.status(404).json({ error: '유효하지 않은 초대 링크입니다' });
    if (invitation.acceptedAt) {
      return res.status(409).json({ error: '이미 수락된 초대입니다' });
    }
    if (invitation.expiresAt < new Date()) {
      return res.status(410).json({ error: '만료된 초대 링크입니다. 회사에 재발급을 요청하세요' });
    }
    res.json({
      invitation: {
        id: invitation.id,
        note: invitation.note,
        expiresAt: invitation.expiresAt,
      },
      company: invitation.company,
    });
  } catch (e) { next(e); }
});

// ---- CREW 인증 필요 ----
router.use(authRequired);

// CREW 가드 — 본 라우터의 인증 이후 엔드포인트는 모두 CREW 계정 전용
function requireCrew(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.accountType !== 'CREW') {
    return res.status(403).json({ error: '시공팀 계정만 사용할 수 있습니다', code: 'NOT_CREW' });
  }
  next();
}

// POST /api/crew/invitations/accept — 시공팀이 토큰 수락 → Vendor row 자동 생성.
// 시공팀 프로필(crewCategory·crewBankAccount·crewDefaultUnitPrice·crewDefaultMeal·crewDefaultTransport)을
// Vendor 필드로 복사. 공종은 필수.
const acceptSchema = z.object({ token: z.string().min(1) });

router.post('/invitations/accept', requireCrew, async (req, res, next) => {
  try {
    const data = acceptSchema.parse(req.body);

    const invitation = await prisma.crewInvitation.findUnique({
      where: { token: data.token },
    });
    if (!invitation) return res.status(404).json({ error: '유효하지 않은 초대 링크입니다' });
    if (invitation.acceptedAt) return res.status(409).json({ error: '이미 수락된 초대입니다' });
    if (invitation.expiresAt < new Date()) return res.status(410).json({ error: '만료된 초대 링크입니다' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, phone: true,
        crewCategories: true, crewBankAccount: true,
        crewDefaultUnitPrice: true, crewDefaultMeal: true, crewDefaultTransport: true,
      },
    });
    const categories = (user?.crewCategories || []).filter(Boolean);
    if (categories.length === 0) {
      return res.status(400).json({ error: '시공팀 프로필에 공종이 등록되어 있지 않습니다. 정보를 먼저 채워주세요' });
    }

    // 이미 같은 회사에 동일 시공팀 매핑이 있는지 확인 (중복 방지)
    const alreadyLinked = await prisma.vendor.findFirst({
      where: { companyId: invitation.companyId, linkedCrewUserId: user.id },
      select: { id: true },
    });
    if (alreadyLinked) {
      return res.status(409).json({ error: '이미 이 회사에 등록된 시공팀입니다' });
    }

    // 공종마다 Vendor row 1개씩 생성 — A=설비+실리콘 같은 다중 공종 자연 처리.
    // 인건비 정산이 공종 칩으로 분리되므로 row 분리가 자연스러움.
    const result = await prisma.$transaction(async (tx) => {
      const createdVendors = [];
      for (const category of categories) {
        const v = await tx.vendor.create({
          data: {
            companyId: invitation.companyId,
            name: user.name,
            category,
            contact: user.name,
            phone: user.phone,
            unitPrice: user.crewDefaultUnitPrice,
            bankAccount: user.crewBankAccount,
            defaultMeal: user.crewDefaultMeal,
            defaultTransport: user.crewDefaultTransport,
            linkedCrewUserId: user.id,
          },
          select: {
            id: true, name: true, category: true,
            company: { select: { id: true, name: true } },
          },
        });
        createdVendors.push(v);
      }

      await tx.crewInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date(),
          acceptedByUserId: user.id,
          // 다중 Vendor가 생성될 수 있어 첫 번째 id를 대표로 기록(나머지는 linkedCrewUserId로 역추적 가능)
          acceptedVendorId: createdVendors[0]?.id || null,
        },
      });

      return createdVendors;
    });

    audit(req, 'crew.invite-accept', {
      companyId: invitation.companyId,
      targetType: 'VENDOR',
      targetId: result[0]?.id,
      metadata: { invitationId: invitation.id, vendorIds: result.map((v) => v.id) },
    });

    res.json({ vendors: result });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// PATCH /api/crew/me — 시공팀 본인 프로필 수정 (공종 다중·계좌·일당·식비·교통비)
const profileSchema = z.object({
  crewCategories: z.array(z.string().min(1).max(40)).min(1).max(25).optional(),
  crewBankAccount: z.string().max(120).optional().nullable(),
  crewDefaultUnitPrice: z.number().nonnegative().optional().nullable(),
  crewDefaultMeal: z.number().nonnegative().optional().nullable(),
  crewDefaultTransport: z.number().nonnegative().optional().nullable(),
});

router.patch('/me', requireCrew, async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body || {});
    const updateData = {};
    if (data.crewCategories !== undefined) {
      updateData.crewCategories = data.crewCategories.map((c) => c.trim()).filter(Boolean);
    }
    if (data.crewBankAccount !== undefined) updateData.crewBankAccount = data.crewBankAccount?.trim() || null;
    if (data.crewDefaultUnitPrice !== undefined) updateData.crewDefaultUnitPrice = data.crewDefaultUnitPrice ?? null;
    if (data.crewDefaultMeal !== undefined) updateData.crewDefaultMeal = data.crewDefaultMeal ?? null;
    if (data.crewDefaultTransport !== undefined) updateData.crewDefaultTransport = data.crewDefaultTransport ?? null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true, name: true, email: true, nickname: true, phone: true,
        crewCategories: true, crewBankAccount: true,
        crewDefaultUnitPrice: true, crewDefaultMeal: true, crewDefaultTransport: true,
      },
    });
    res.json({ user });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// GET /api/crew/me — 시공팀 본인 프로필 + 거래 회사 매핑 목록 (CrewHome용)
router.get('/me', requireCrew, async (req, res, next) => {
  try {
    const [user, vendors] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true, name: true, email: true, nickname: true, phone: true,
          crewCategories: true, crewBankAccount: true,
          crewDefaultUnitPrice: true, crewDefaultMeal: true, crewDefaultTransport: true,
        },
      }),
      prisma.vendor.findMany({
        where: { linkedCrewUserId: req.user.id },
        select: {
          id: true,
          name: true,
          category: true,
          company: { select: { id: true, name: true } },
        },
        orderBy: [{ company: { name: 'asc' } }, { category: 'asc' }],
      }),
    ]);

    // 회사별 그루핑 — 한 회사가 목공팀 3개 Vendor(반장·기공·조공) 가질 때 한 카드로 묶음
    const byCompany = new Map();
    for (const v of vendors) {
      const cid = v.company.id;
      if (!byCompany.has(cid)) {
        byCompany.set(cid, {
          companyId: cid,
          companyName: v.company.name,
          vendors: [],
        });
      }
      byCompany.get(cid).vendors.push({ id: v.id, name: v.name, category: v.category });
    }

    res.json({
      user,
      companies: Array.from(byCompany.values()),
      totalVendors: vendors.length,
    });
  } catch (e) { next(e); }
});

// GET /api/crew/schedules?from=YYYY-MM-DD&to=YYYY-MM-DD
// 본인 매핑 Vendor들의 DailyScheduleEntry만. 회사·프로젝트·공종 컨텍스트 포함, 그 외(견적·정산 등) 절대 노출 X.
// 회사 데이터 격리 정책 — [[crewaccount]] 메모리 정합.
router.get('/schedules', requireCrew, async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date();
    const to = req.query.to ? new Date(req.query.to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return res.status(400).json({ error: 'from / to 날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' });
    }

    const entries = await prisma.dailyScheduleEntry.findMany({
      where: {
        date: { gte: from, lte: to },
        vendor: { linkedCrewUserId: req.user.id },
      },
      select: {
        id: true,
        date: true,
        category: true,
        content: true,
        confirmed: true,
        orderIndex: true,
        project: { select: { id: true, name: true, siteAddress: true } },
        vendor: { select: { id: true, name: true, category: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }],
    });

    // 일정의 회사 컨텍스트 — projectId 있으면 project.company, 아니면 직접 companyId
    // (개인정보 격리: 시공팀에 보이는 건 회사명·프로젝트 이름·주소·공종·일정 본문까지)
    const projectCompanies = await prisma.project.findMany({
      where: {
        id: { in: entries.map((e) => e.project?.id).filter(Boolean) },
      },
      select: { id: true, company: { select: { id: true, name: true } } },
    });
    const projectToCompany = new Map(projectCompanies.map((p) => [p.id, p.company]));

    const enriched = entries.map((e) => {
      const company = e.project ? projectToCompany.get(e.project.id) : e.company;
      return {
        id: e.id,
        date: e.date,
        category: e.category,
        content: e.content,
        confirmed: e.confirmed,
        project: e.project,
        vendor: e.vendor,
        company,
      };
    });

    res.json({ schedules: enriched });
  } catch (e) { next(e); }
});

module.exports = router;
