// 회사 자산 JSON 임포트/익스포트 라우트 — 신규 인테리어 업체 락인 시드용.
// 사용자ID·프로젝트 데이터는 포함하지 않음. OWNER 만 사용 가능.
//
// GET  /api/company-assets/export      → 다운로드 JSON (회사 자산 9종)
// POST /api/company-assets/import      → JSON 임포트 (Seed 모드만)
//
// 양식·운영 정책은 `수플렉스_운영_TODO목록.md` 6-F 참조.

const express = require('express');
const prisma = require('../config/prisma');
const { authRequired, requireRole } = require('../middlewares/auth');
const { exportCompanyAssets } = require('../services/companyAssetExport');
const { importCompanyAssets } = require('../services/companyAssetImport');
const { exportFullCompany } = require('../services/fullCompanyExport');
const { audit } = require('../services/audit');

const router = express.Router();

// HTTP 헤더는 ASCII 만 허용 — 한글 회사명을 그대로 넣으면 ERR_INVALID_CHAR.
// RFC 5987: filename="ASCII_폴백" + filename*=UTF-8''<percent-encoded>
function contentDispositionAttachment(filename) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

// 임포트 JSON 은 거래처·템플릿 합쳐서 수 MB 가능 — 라우트 자체에 큰 limit
router.use(express.json({ limit: '20mb' }));
router.use(authRequired);
router.use(requireRole('OWNER'));

router.get('/export', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const payload = await exportCompanyAssets(prisma, companyId);

    audit(req, 'company-assets.export', { metadata: { counts: payload.counts } });

    const safeName = (payload.sourceCompanyName || 'suplex').replace(/[^\w가-힣]+/g, '_');
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', contentDispositionAttachment(`suplex_assets_${safeName}_${date}.json`));
    res.json(payload);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

// 회사 전체 데이터(자산 + 프로젝트 + 모든 하위 모델). import 는 다음 사이클.
router.get('/export-full', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const payload = await exportFullCompany(prisma, companyId);

    audit(req, 'company-assets.export-full', { metadata: { counts: payload.counts } });

    const safeName = (payload.sourceCompanyName || 'suplex').replace(/[^\w가-힣]+/g, '_');
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', contentDispositionAttachment(`suplex_full_${safeName}_${date}.json`));
    res.json(payload);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

router.post('/import', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { payload, mode = 'seed' } = req.body || {};

    const report = await importCompanyAssets(prisma, { companyId, payload, mode });

    audit(req, 'company-assets.import', { metadata: { mode, report } });

    res.json({ ok: true, mode, report });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

module.exports = router;
