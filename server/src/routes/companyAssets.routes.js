// 회사 자산 / 전체 데이터 JSON 임포트·익스포트 — 슈퍼어드민 전용.
// (구) OWNER 가 Settings 에서 직접 호출 → (신) 어드민 콘솔에서 봉기님이 회사별로 처리.
// 회사가 백업/이전이 필요하면 카톡·메일로 요청 → 어드민이 콘솔에서 export 해서 파일 전달.
// 마운트 경로: `/api/admin/companies/:companyId/data-transfer/*`
//
// GET  …/export        → 자산 9종 JSON
// GET  …/export-full   → 자산 + 모든 프로젝트 통째 JSON
// POST …/import        → 자산 Seed (기존 비어있는 자리에만)
// POST …/import-full   → 전체 데이터 (빈 회사 한정, 5분 트랜잭션)

const express = require('express');
const prisma = require('../config/prisma');
const { authRequired, requireSuperAdmin } = require('../middlewares/auth');
const { exportCompanyAssets } = require('../services/companyAssetExport');
const { importCompanyAssets } = require('../services/companyAssetImport');
const { exportFullCompany } = require('../services/fullCompanyExport');
const { importFullCompany } = require('../services/fullCompanyImport');
const { audit } = require('../services/audit');

// mergeParams: 부모 라우터의 :companyId 를 자식에서 받기 위해 필수
const router = express.Router({ mergeParams: true });

// HTTP 헤더는 ASCII 만 허용 — 한글 회사명을 그대로 넣으면 ERR_INVALID_CHAR.
// RFC 5987: filename="ASCII_폴백" + filename*=UTF-8''<percent-encoded>
function contentDispositionAttachment(filename) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

router.use(express.json({ limit: '20mb' }));
router.use(authRequired);
router.use(requireSuperAdmin);

// 대상 회사 검증 — :companyId 는 부모 라우터에서 주입
async function resolveTargetCompany(req, res, next) {
  const companyId = req.params.companyId;
  if (!companyId) return res.status(400).json({ error: 'companyId required' });
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true },
  });
  if (!company) return res.status(404).json({ error: 'Company not found' });
  req.targetCompany = company;
  next();
}

// import-full 은 OWNER 유저ID 로 일괄 매핑 — 대상 회사의 현재 OWNER 한 명 필요
async function pickOwnerUserId(prisma, companyId) {
  const owner = await prisma.companyMembership.findFirst({
    where: { companyId, role: 'OWNER' },
    select: { userId: true },
  });
  if (!owner) {
    const err = new Error('대상 회사에 OWNER 가 없습니다. 먼저 OWNER 를 지정해주세요.');
    err.status = 400;
    throw err;
  }
  return owner.userId;
}

router.use(resolveTargetCompany);

router.get('/export', async (req, res, next) => {
  try {
    const { id: companyId, name } = req.targetCompany;
    const payload = await exportCompanyAssets(prisma, companyId);

    audit(req, 'admin.company-data.export', { companyId, metadata: { counts: payload.counts } });

    const safeName = (payload.sourceCompanyName || name || 'suplex').replace(/[^\w가-힣]+/g, '_');
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', contentDispositionAttachment(`suplex_assets_${safeName}_${date}.json`));
    res.json(payload);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

router.get('/export-full', async (req, res, next) => {
  try {
    const { id: companyId, name } = req.targetCompany;
    const payload = await exportFullCompany(prisma, companyId);

    audit(req, 'admin.company-data.export-full', { companyId, metadata: { counts: payload.counts } });

    const safeName = (payload.sourceCompanyName || name || 'suplex').replace(/[^\w가-힣]+/g, '_');
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', contentDispositionAttachment(`suplex_full_${safeName}_${date}.json`));
    res.json(payload);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

router.post('/import-full', async (req, res, next) => {
  try {
    const { id: companyId } = req.targetCompany;
    const { payload } = req.body || {};

    const ownerUserId = await pickOwnerUserId(prisma, companyId);
    const report = await importFullCompany(prisma, { companyId, ownerUserId, payload });

    audit(req, 'admin.company-data.import-full', { companyId, metadata: { report } });

    res.json({ ok: true, report });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

router.post('/import', async (req, res, next) => {
  try {
    const { id: companyId } = req.targetCompany;
    const { payload, mode = 'seed' } = req.body || {};

    const report = await importCompanyAssets(prisma, { companyId, payload, mode });

    audit(req, 'admin.company-data.import', { companyId, metadata: { mode, report } });

    res.json({ ok: true, mode, report });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

module.exports = router;
