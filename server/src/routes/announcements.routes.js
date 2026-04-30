// 사용자용 시스템 공지 — 활성 공지 목록 조회 (헤더 배너용)
// 인증된 사용자만 접근. requireApprovedCompany는 index.js에서 적용됨.
const express = require('express');
const prisma = require('../config/prisma');

const router = express.Router();

// GET /api/announcements/active — 현재 시각 기준 노출 대상 공지
router.get('/active', async (req, res, next) => {
  try {
    const now = new Date();
    const list = await prisma.systemAnnouncement.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, body: true, level: true, createdAt: true },
    });
    res.json({ announcements: list });
  } catch (e) { next(e); }
});

module.exports = router;
