// 프로젝트 사진 외부 보관 (Partial Archive)
// — ZIP 다운로드 후 클라우드에서 영구 제거. 메타데이터·메모·견적은 그대로 유지.
// — 재업로드 시 동일 출처(체크리스트/리포트/자재요청)에 다시 올리면 자연 복원.
//
// Endpoints (mounted at /api/projects/:projectId/photo-archive):
//   GET  /summary       — 사진 수, 보관 이력 등 UI 표시용
//   GET  /download.zip  — 전체 사진 + manifest.json ZIP 스트리밍
//   POST /purge         — DB 레코드 + Cloudinary 영구 삭제 (confirmDownloaded:true 필수)

const express = require('express');
const https = require('https');
const archiver = require('archiver');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { deleteByPublicId, isConfigured } = require('../services/photoUpload');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

// Cloudinary URL → publicId 파싱 (publicId 컬럼이 비어있는 기존 행 fallback).
// 패턴: https://res.cloudinary.com/<cloud>/image/upload/[v123/]folder/sub/file.ext
function parsePublicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/);
  return m ? m[1] : null;
}

function fetchAsStream(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      resolve(res);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error(`Timeout fetching ${url}`));
    });
  });
}

function safe(s, fallback = '_') {
  return (s || fallback).replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60);
}

function extFromUrl(url) {
  const m = url && url.match(/\.([a-zA-Z0-9]{2,5})(?:\?.*)?$/);
  return m ? m[1].toLowerCase() : 'jpg';
}

// ProjectPhoto + TaskPhoto 통합 조회 + sourceLabel 보강
async function loadAllPhotos(projectId) {
  const [projectPhotos, taskPhotos] = await Promise.all([
    prisma.projectPhoto.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.taskPhoto.findMany({
      where: { task: { schedule: { projectId } } },
      orderBy: { createdAt: 'asc' },
      include: {
        task: { include: { schedule: { select: { name: true } } } },
      },
    }),
  ]);

  // ProjectPhoto 라벨 보강 (출처별)
  const reportIds = [...new Set(projectPhotos.filter((p) => p.source === 'REPORT').map((p) => p.sourceId))];
  const checklistIds = [
    ...new Set(projectPhotos.filter((p) => p.source === 'CHECKLIST').map((p) => p.sourceId)),
  ];
  const requestIds = [
    ...new Set(projectPhotos.filter((p) => p.source === 'MATERIAL_REQUEST').map((p) => p.sourceId)),
  ];
  const [reports, checklists, requests] = await Promise.all([
    reportIds.length
      ? prisma.dailyReport.findMany({ where: { id: { in: reportIds } }, select: { id: true, date: true } })
      : [],
    checklistIds.length
      ? prisma.projectChecklist.findMany({
          where: { id: { in: checklistIds } },
          select: { id: true, title: true, phase: true },
        })
      : [],
    requestIds.length
      ? prisma.materialRequest.findMany({
          where: { id: { in: requestIds } },
          select: { id: true, itemName: true },
        })
      : [],
  ]);
  const rMap = Object.fromEntries(reports.map((r) => [r.id, r]));
  const cMap = Object.fromEntries(checklists.map((c) => [c.id, c]));
  const qMap = Object.fromEntries(requests.map((r) => [r.id, r]));

  const flat = [];
  let idx = 0;

  for (const p of projectPhotos) {
    let folder = 'misc';
    let label = '';
    if (p.source === 'REPORT' && rMap[p.sourceId]) {
      folder = 'report';
      label = new Date(rMap[p.sourceId].date).toISOString().slice(0, 10);
    } else if (p.source === 'CHECKLIST' && cMap[p.sourceId]) {
      folder = 'checklist';
      label = cMap[p.sourceId].title;
    } else if (p.source === 'MATERIAL_REQUEST' && qMap[p.sourceId]) {
      folder = 'material';
      label = qMap[p.sourceId].itemName;
    }
    idx += 1;
    const filename = `${folder}/${safe(label)}/${String(idx).padStart(4, '0')}.${extFromUrl(p.url)}`;
    flat.push({
      kind: 'project',
      id: p.id,
      source: p.source,
      sourceId: p.sourceId,
      sourceLabel: label,
      caption: p.caption,
      createdAt: p.createdAt,
      url: p.url,
      publicId: p.publicId,
      filename,
    });
  }

  for (const tp of taskPhotos) {
    const scheduleName = tp.task?.schedule?.name || '';
    idx += 1;
    const filename = `task/${safe(scheduleName)}/${String(idx).padStart(4, '0')}.${extFromUrl(tp.url)}`;
    flat.push({
      kind: 'task',
      id: tp.id,
      taskId: tp.taskId,
      sourceLabel: scheduleName,
      caption: tp.caption,
      createdAt: tp.createdAt,
      url: tp.url,
      publicId: tp.publicId,
      filename,
    });
  }

  return flat;
}

// GET /summary — UI 패널 표시용
router.get('/summary', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [projectCount, taskCount] = await Promise.all([
      prisma.projectPhoto.count({ where: { projectId } }),
      prisma.taskPhoto.count({ where: { task: { schedule: { projectId } } } }),
    ]);

    res.json({
      projectId,
      projectName: project.name,
      photoCount: projectCount + taskCount,
      breakdown: { project: projectCount, task: taskCount },
      photosArchivedAt: project.photosArchivedAt,
    });
  } catch (e) {
    next(e);
  }
});

// GET /download.zip — ZIP 스트리밍 (사진 + manifest.json)
router.get('/download.zip', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const photos = await loadAllPhotos(projectId);
    if (photos.length === 0) {
      return res.status(404).json({ error: '사진이 없습니다' });
    }

    const safeName = project.name.replace(/[^\w가-힣]+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `suplex_photos_${safeName}_${dateStr}.zip`;

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') console.warn('archive warn:', err);
    });
    archive.on('error', (err) => {
      console.error('archive error:', err);
      try {
        res.destroy(err);
      } catch (_) {}
    });
    archive.pipe(res);

    const manifest = {
      version: '1.0',
      type: 'photo-archive',
      exportedAt: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
        siteAddress: project.siteAddress,
        customerName: project.customerName,
      },
      note:
        '이 ZIP은 Suplex 프로젝트 사진의 외부 백업입니다. 재업로드 시 동일 출처(체크리스트/리포트/자재요청)에 다시 올리면 프로젝트에 복원됩니다. manifest.json을 같이 보관하시면 어느 항목 사진인지 추적할 수 있습니다.',
      photos: photos.map((p) => ({
        kind: p.kind,
        id: p.id,
        source: p.source || null,
        sourceId: p.sourceId || null,
        taskId: p.taskId || null,
        sourceLabel: p.sourceLabel,
        caption: p.caption,
        createdAt: p.createdAt,
        originalUrl: p.url,
        filename: p.filename,
      })),
    };

    // 사진들을 순차 fetch & append
    for (const p of photos) {
      try {
        const stream = await fetchAsStream(p.url);
        archive.append(stream, { name: p.filename });
      } catch (err) {
        // 개별 실패는 manifest에 표시하고 계속 (전체 실패로 끌고가지 않음)
        archive.append(`사진 다운로드 실패: ${p.url}\n${err.message}`, {
          name: `${p.filename}.ERROR.txt`,
        });
      }
    }

    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
    await archive.finalize();
  } catch (e) {
    next(e);
  }
});

// POST /purge — DB+Cloudinary 영구 삭제. confirmDownloaded:true 필수.
router.post('/purge', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!req.body || req.body.confirmDownloaded !== true) {
      return res.status(400).json({
        error: 'ZIP 다운로드 확인이 필요합니다 (confirmDownloaded:true 누락)',
      });
    }

    const photos = await loadAllPhotos(projectId);
    if (photos.length === 0) {
      return res.json({ ok: true, deleted: 0, photosArchivedAt: project.photosArchivedAt });
    }

    // Cloudinary 삭제 — best-effort. 실패해도 DB 레코드는 정리해야 함.
    let cloudFailed = 0;
    if (isConfigured()) {
      for (const p of photos) {
        const pid = p.publicId || parsePublicIdFromUrl(p.url);
        if (!pid) {
          cloudFailed += 1;
          continue;
        }
        try {
          await deleteByPublicId(pid);
        } catch (_) {
          cloudFailed += 1;
        }
      }
    }

    const taskPhotoIds = photos.filter((p) => p.kind === 'task').map((p) => p.id);
    const projectPhotoIds = photos.filter((p) => p.kind === 'project').map((p) => p.id);

    const archivedAt = new Date();
    await prisma.$transaction([
      prisma.taskPhoto.deleteMany({ where: { id: { in: taskPhotoIds } } }),
      prisma.projectPhoto.deleteMany({ where: { id: { in: projectPhotoIds } } }),
      prisma.project.update({
        where: { id: projectId },
        data: { photosArchivedAt: archivedAt },
      }),
    ]);

    res.json({
      ok: true,
      deleted: photos.length,
      cloudFailed,
      photosArchivedAt: archivedAt.toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
