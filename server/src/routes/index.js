const express = require('express');
const authRoutes = require('./auth.routes');
const projectRoutes = require('./projects.routes');
const schedules = require('./schedules.routes');
const scheduleChanges = require('./scheduleChanges.routes');
const checklists = require('./checklists.routes');
const materialRoutes = require('./materials.routes');
const materialTemplateRoutes = require('./materialTemplates.routes');
const reportRoutes = require('./reports.routes');
const issueRoutes = require('./issues.routes');
const materialRequestRoutes = require('./materialRequests.routes');
const photoRoutes = require('./photos.routes');
const quoteRoutes = require('./quotes.routes');
const quoteTemplateRoutes = require('./quoteLineItemTemplates.routes');
const companyRoutes = require('./company.routes');
const purchaseOrderRoutes = require('./purchaseOrders.routes');
const expenseRoutes = require('./expenses.routes');
const accountCodeRoutes = require('./accountCodes.routes');
const expenseRuleRoutes = require('./expenseRules.routes');
const aiBookkeeperRoutes = require('./aiBookkeeper.routes');
const backupRoutes = require('./backup.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'splex-api' });
});

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);

// 프로젝트-스코프
router.use('/projects/:projectId/schedules', schedules.projectRouter);
router.use('/projects/:projectId/schedule-changes', scheduleChanges.projectRouter);
router.use('/projects/:projectId/checklists', checklists.router);
router.use('/projects/:projectId/materials', materialRoutes);
router.use('/projects/:projectId/reports', reportRoutes);
router.use('/projects/:projectId/issues', issueRoutes);
router.use('/projects/:projectId/material-requests', materialRequestRoutes);
router.use('/projects/:projectId/photos', photoRoutes);
router.use('/projects/:projectId/quotes', quoteRoutes);
router.use('/projects/:projectId/purchase-orders', purchaseOrderRoutes);

// 회사 전체 스코프
router.use('/company', companyRoutes);
router.use('/schedules', schedules.globalRouter);
router.use('/schedule-changes', scheduleChanges.globalRouter);
router.use('/checklists', checklists.globalRouter);
router.use('/material-templates', materialTemplateRoutes);
router.use('/quote-templates', quoteTemplateRoutes);
router.use('/expenses', expenseRoutes);
router.use('/account-codes', accountCodeRoutes);
router.use('/expense-rules', expenseRuleRoutes);
router.use('/ai-bookkeeper', aiBookkeeperRoutes);

// 백업
router.use('/backup', backupRoutes);

module.exports = router;
