const express = require('express');
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

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'suplex-api' });
});

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);

// 프로젝트-스코프
router.use('/projects/:projectId/schedules', schedules.projectRouter);
router.use('/projects/:projectId/schedule-changes', scheduleChanges.projectRouter);
router.use('/projects/:projectId/checklists', checklists.router);
router.use('/projects/:projectId/materials', materialRoutes);
router.use('/projects/:projectId/reports', reportRoutes);
router.use('/projects/:projectId/material-requests', materialRequestRoutes);
router.use('/projects/:projectId/photos', photoRoutes);
router.use('/projects/:projectId/quotes', quoteRoutes);
router.use('/projects/:projectId/simple-quotes', simpleQuoteRoutes);
router.use('/projects/:projectId/memos', projectMemoRoutes);
router.use('/projects/:projectId/phase-notes', phaseNotesRoutes);
router.use('/projects/:projectId/purchase-orders', purchaseOrders.projectRouter);

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

// 백업
router.use('/backup', backupRoutes);

module.exports = router;
