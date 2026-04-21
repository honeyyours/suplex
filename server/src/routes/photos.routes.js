const express = require('express');
const multer = require('multer');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { uploadBuffer, isConfigured } = require('../services/photoUpload');

const projectRouter = express.Router({ mergeParams: true });
projectRouter.use(authRequired);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB x 10
});

const SOURCES = ['REPORT', 'ISSUE', 'MATERIAL_REQUEST'];

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

async function assertSourceExists(source, sourceId, projectId) {
  if (source === 'REPORT') {
    return prisma.dailyReport.findFirst({ where: { id: sourceId, projectId } });
  }
  if (source === 'ISSUE') {
    return prisma.issue.findFirst({ where: { id: sourceId, projectId } });
  }
  if (source === 'MATERIAL_REQUEST') {
    return prisma.materialRequest.findFirst({ where: { id: sourceId, projectId } });
  }
  return null;
}

// POST /api/projects/:projectId/photos  (multipart/form-data)
// body: source, sourceId, caption?, photos (file[])
projectRouter.post('/', upload.array('photos', 10), async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { source, sourceId, caption } = req.body;
    if (!SOURCES.includes(source)) {
      return res.status(400).json({ error: 'source 값 확인' });
    }
    if (!sourceId) return res.status(400).json({ error: 'sourceId 필요' });

    const src = await assertSourceExists(source, sourceId, projectId);
    if (!src) return res.status(404).json({ error: 'source 레코드를 찾을 수 없습니다' });

    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ error: '파일이 없습니다' });

    if (!isConfigured()) {
      return res.status(503).json({
        error: 'Cloudinary가 설정되지 않았습니다',
        hint: '서버 .env에 CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET 설정 후 재시작',
      });
    }

    const folder = `splex/${projectId}/${source.toLowerCase()}`;
    const uploaded = [];
    for (const f of files) {
      const { url, thumbnailUrl } = await uploadBuffer(f.buffer, { folder });
      const photo = await prisma.projectPhoto.create({
        data: {
          projectId,
          source,
          sourceId,
          url,
          thumbnailUrl,
          caption: caption || null,
          uploadedById: req.user.id,
        },
      });
      uploaded.push(photo);
    }

    res.status(201).json({ photos: uploaded });
  } catch (e) {
    if (e.status === 503) return res.status(503).json({ error: e.message });
    next(e);
  }
});

// GET /api/projects/:projectId/photos?source=&sourceId=&from=&to=&limit=
projectRouter.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const where = { projectId };
    if (req.query.source && SOURCES.includes(req.query.source)) {
      where.source = req.query.source;
    }
    if (req.query.sourceId) where.sourceId = req.query.sourceId;
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt.gte = new Date(req.query.from);
      if (req.query.to) where.createdAt.lte = new Date(req.query.to);
    }

    const photos = await prisma.projectPhoto.findMany({
      where,
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: Number(req.query.limit) || 200,
    });
    res.json({ photos });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/projects/:projectId/photos/:photoId
projectRouter.delete('/:photoId', async (req, res, next) => {
  try {
    const { projectId, photoId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.projectPhoto.findFirst({
      where: { id: photoId, projectId },
    });
    if (!existing) return res.status(404).json({ error: 'Photo not found' });

    await prisma.projectPhoto.delete({ where: { id: photoId } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = projectRouter;
