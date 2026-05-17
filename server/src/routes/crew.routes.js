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

// GET /api/crew/invitations/:token — 초대 토큰 검증. 시공팀이 링크 클릭했을 때 회사명 노출.
// 미가입 시공팀도 호출 가능(가입 후 자동 수락 흐름).
router.get('/invitations/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const vendor = await prisma.vendor.findUnique({
      where: { crewInviteToken: token },
      select: {
        id: true,
        name: true,
        category: true,
        crewInviteExpiresAt: true,
        linkedCrewUserId: true,
        company: { select: { id: true, name: true } },
      },
    });
    if (!vendor) return res.status(404).json({ error: '유효하지 않은 초대 링크입니다' });
    if (vendor.linkedCrewUserId) {
      return res.status(409).json({ error: '이미 수락된 초대입니다' });
    }
    if (vendor.crewInviteExpiresAt && vendor.crewInviteExpiresAt < new Date()) {
      return res.status(410).json({ error: '만료된 초대 링크입니다. 회사에 재발급을 요청하세요' });
    }
    res.json({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        expiresAt: vendor.crewInviteExpiresAt,
      },
      company: vendor.company,
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

// POST /api/crew/invitations/accept — 시공팀이 토큰 수락. 인증된 CREW 계정이 호출.
const acceptSchema = z.object({ token: z.string().min(1) });

router.post('/invitations/accept', requireCrew, async (req, res, next) => {
  try {
    const data = acceptSchema.parse(req.body);
    const vendor = await prisma.vendor.findUnique({
      where: { crewInviteToken: data.token },
      select: {
        id: true,
        companyId: true,
        linkedCrewUserId: true,
        crewInviteExpiresAt: true,
      },
    });
    if (!vendor) return res.status(404).json({ error: '유효하지 않은 초대 링크입니다' });
    if (vendor.linkedCrewUserId) {
      return res.status(409).json({ error: '이미 수락된 초대입니다' });
    }
    if (vendor.crewInviteExpiresAt && vendor.crewInviteExpiresAt < new Date()) {
      return res.status(410).json({ error: '만료된 초대 링크입니다' });
    }

    const updated = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        linkedCrewUserId: req.user.id,
        crewInviteToken: null,
        crewInviteSentAt: null,
        crewInviteExpiresAt: null,
      },
      select: {
        id: true,
        name: true,
        category: true,
        company: { select: { id: true, name: true } },
      },
    });

    audit(req, 'crew.invite-accept', {
      companyId: vendor.companyId,
      targetType: 'VENDOR',
      targetId: vendor.id,
    });

    res.json({ vendor: updated });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// GET /api/crew/me — 시공팀 본인 + 거래 회사 매핑 목록 (CrewHome용)
router.get('/me', requireCrew, async (req, res, next) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { linkedCrewUserId: req.user.id },
      select: {
        id: true,
        name: true,
        category: true,
        company: { select: { id: true, name: true } },
      },
      orderBy: [{ company: { name: 'asc' } }, { category: 'asc' }],
    });

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
      companies: Array.from(byCompany.values()),
      totalVendors: vendors.length,
    });
  } catch (e) { next(e); }
});

module.exports = router;
