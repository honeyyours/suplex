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
        crewCategory: true, crewBankAccount: true,
        crewDefaultUnitPrice: true, crewDefaultMeal: true, crewDefaultTransport: true,
      },
    });
    if (!user?.crewCategory) {
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

    const result = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.create({
        data: {
          companyId: invitation.companyId,
          name: user.name,
          category: user.crewCategory,
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

      await tx.crewInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date(),
          acceptedByUserId: user.id,
          acceptedVendorId: vendor.id,
        },
      });

      return vendor;
    });

    audit(req, 'crew.invite-accept', {
      companyId: invitation.companyId,
      targetType: 'VENDOR',
      targetId: result.id,
      metadata: { invitationId: invitation.id },
    });

    res.json({ vendor: result });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// PATCH /api/crew/me — 시공팀 본인 프로필 수정 (공종·계좌·일당·식비·교통비)
const profileSchema = z.object({
  crewCategory: z.string().min(1).max(40).optional().nullable(),
  crewBankAccount: z.string().max(120).optional().nullable(),
  crewDefaultUnitPrice: z.number().nonnegative().optional().nullable(),
  crewDefaultMeal: z.number().nonnegative().optional().nullable(),
  crewDefaultTransport: z.number().nonnegative().optional().nullable(),
});

router.patch('/me', requireCrew, async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body || {});
    const updateData = {};
    if (data.crewCategory !== undefined) updateData.crewCategory = data.crewCategory?.trim() || null;
    if (data.crewBankAccount !== undefined) updateData.crewBankAccount = data.crewBankAccount?.trim() || null;
    if (data.crewDefaultUnitPrice !== undefined) updateData.crewDefaultUnitPrice = data.crewDefaultUnitPrice ?? null;
    if (data.crewDefaultMeal !== undefined) updateData.crewDefaultMeal = data.crewDefaultMeal ?? null;
    if (data.crewDefaultTransport !== undefined) updateData.crewDefaultTransport = data.crewDefaultTransport ?? null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true, name: true, email: true, nickname: true, phone: true,
        crewCategory: true, crewBankAccount: true,
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
          crewCategory: true, crewBankAccount: true,
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

module.exports = router;
