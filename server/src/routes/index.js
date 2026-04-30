const express = require('express');
const { authRequired, requireApprovedCompany } = require('../middlewares/auth');
const authRoutes = require('./auth.routes');
const projectRoutes = require('./projects.routes');
const schedules = require('./schedules.routes');
const scheduleChanges = require('./scheduleChanges.routes');
const checklists = require('./checklists.routes');
const materialRoutes = require('./materials.routes');
const materialTemplateRoutes = require('./materialTemplates.routes');
const phaseKeywordRoutes = require('./phaseKeywords.routes');
const phasesRoutes = require('./phases.routes');
const reportRoutes = require('./reports.routes');
const materialRequestRoutes = require('./materialRequests.routes');
const photoRoutes = require('./photos.routes');
const photoArchiveRoutes = require('./projectPhotoArchive.routes');
const quoteRoutes = require('./quotes.routes');
const simpleQuoteRoutes = require('./simpleQuotes.routes');
const projectMemoRoutes = require('./projectMemos.routes');
const phaseNotesRoutes = require('./phaseNotes.routes');
const companyPhaseTipsRoutes = require('./companyPhaseTips.routes');
const phaseRulesRoutes = require('./phaseRules.routes');
const quoteTemplateRoutes = require('./quoteLineItemTemplates.routes');
const companyRoutes = require('./company.routes');
const purchaseOrders = require('./purchaseOrders.routes');
const expenseRoutes = require('./expenses.routes');
const accountCodeRoutes = require('./accountCodes.routes');
const expenseRuleRoutes = require('./expenseRules.routes');
const aiAssistantRoutes = require('./aiAssistant.routes');
const teamRoutes = require('./team.routes');
const invitationRoutes = require('./invitations.routes');
const adminRoutes = require('./admin.routes');
const vendorRoutes = require('./vendors.routes');
const backupRoutes = require('./backup.routes');
const activityRoutes = require('./activity.routes');
const applianceSpecsRoutes = require('./applianceSpecs.routes');
const announcementsRoutes = require('./announcements.routes');
const { requireProjectMember } = require('../middlewares/projectAccess');

const router = express.Router();

// 헬스체크는 app.js의 `/health`로 단일화 (2026-04-30).
// 과거 `/api/health`를 사용하던 외부 모니터링이 있을 수 있어 별칭만 남겨둠 — 신규 사용 X.
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'suplex-api', note: 'use /health (top-level) instead' });
});

router.use('/auth', authRoutes);

// 베타 진입 통제 — /auth, /admin, /backup 외 모든 라우트는 회사 APPROVED일 때만 통과.
// authRequired는 각 하위 라우터가 이미 호출하므로(req.user 채움), 여기선 가드만 추가.
router.use((req, res, next) => {
  // /admin, /backup은 별도 라우터에서 super admin 체크. 여기선 통과.
  if (req.path.startsWith('/admin') || req.path.startsWith('/backup')) return next();
  // 그 외는 인증 + 승인 가드 적용
  authRequired(req, res, (err) => {
    if (err || res.headersSent) return;
    requireApprovedCompany(req, res, next);
  });
});

router.use('/projects', projectRoutes);

// 프로젝트-스코프 — 모든 중첩 라우트에 멤버십 가드 (OWNER 우회)
const pmGuard = requireProjectMember('projectId');
router.use('/projects/:projectId/schedules', pmGuard, schedules.projectRouter);
router.use('/projects/:projectId/schedule-changes', pmGuard, scheduleChanges.projectRouter);
router.use('/projects/:projectId/checklists', pmGuard, checklists.router);
router.use('/projects/:projectId/materials', pmGuard, materialRoutes);
router.use('/projects/:projectId/reports', pmGuard, reportRoutes);
router.use('/projects/:projectId/material-requests', pmGuard, materialRequestRoutes);
router.use('/projects/:projectId/photos', pmGuard, photoRoutes);
router.use('/projects/:projectId/photo-archive', pmGuard, photoArchiveRoutes);
router.use('/projects/:projectId/quotes', pmGuard, quoteRoutes);
router.use('/projects/:projectId/simple-quotes', pmGuard, simpleQuoteRoutes);
router.use('/projects/:projectId/memos', pmGuard, projectMemoRoutes);
router.use('/projects/:projectId/phase-notes', pmGuard, phaseNotesRoutes);
router.use('/projects/:projectId/purchase-orders', pmGuard, purchaseOrders.projectRouter);

// 회사 전체 스코프
router.use('/company', companyRoutes);
router.use('/schedules', schedules.globalRouter);
router.use('/schedule-changes', scheduleChanges.globalRouter);
router.use('/checklists', checklists.globalRouter);
router.use('/material-templates', materialTemplateRoutes);
router.use('/purchase-orders', purchaseOrders.globalRouter);
router.use('/phase-keywords', phaseKeywordRoutes);
router.use('/phases', phasesRoutes);
router.use('/phase-rules', phaseRulesRoutes);
router.use('/quote-templates', quoteTemplateRoutes);
router.use('/company-phase-tips', companyPhaseTipsRoutes);
router.use('/expenses', expenseRoutes);
router.use('/account-codes', accountCodeRoutes);
router.use('/expense-rules', expenseRuleRoutes);
router.use('/ai-assistant', aiAssistantRoutes);
router.use('/team', teamRoutes);
router.use('/invitations', invitationRoutes);
router.use('/admin', adminRoutes);
router.use('/vendors', vendorRoutes);
router.use('/activity', activityRoutes);
router.use('/appliance-specs', applianceSpecsRoutes);
router.use('/announcements', announcementsRoutes);

// 백업
router.use('/backup', backupRoutes);

module.exports = router;
