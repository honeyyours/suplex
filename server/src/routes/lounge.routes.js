// 라운지(커뮤니티) API — docs/커뮤니티_기획서.md
//
// 베타 진입 통제(requireApprovedCompany)를 우회하도록 routes/index.js에서 분기됨.
// 라운지 자체 가드: requireLoungeMember (LoungeMembership.status === 'active').
// 슈퍼어드민은 우회.
//
// v1 범위: 카테고리/태그 조회, 글·댓글·공감·신고 CRUD, 홈 카드, 본인 프로필.
// 첨부(이미지/.rb)는 task #8에서 추가.

const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const {
  LOUNGE_CATEGORIES,
  LOUNGE_CATEGORY_KEYS,
  canAccessLounge,
} = require('../services/lounge');
const {
  uploadBuffer,
  uploadRawBuffer,
  deleteByPublicId,
  deleteRawByPublicId,
  isConfigured,
} = require('../services/photoUpload');

const router = express.Router();
router.use(authRequired);

const REPORT_REASONS = ['spam', 'abuse', 'client_info', 'malicious_code', 'other'];
const JOB_ROLES = ['designer', 'site', 'ops', 'etc'];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB
const MAX_RUBY_SIZE = 1 * 1024 * 1024;   // 1MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;  // 20MB
const MAX_IMAGES_PER_POST = 5;
const MAX_RUBY_PER_POST = 3;
const MAX_FILES_PER_POST = 5;

// 실행파일 차단 — 확장자·MIME 모두 검사. 인테리어 도면(.dwg/.skp)·문서·zip은 허용.
const BLOCKED_FILE_EXTS = [
  '.exe', '.bat', '.cmd', '.com', '.sh', '.ps1', '.vbs', '.vbe',
  '.scr', '.msi', '.msp', '.jar', '.app', '.dll', '.cpl', '.pif',
  '.gadget', '.wsf', '.wsh', '.hta', '.lnk',
];

// multer 설정 — 이미지/.rb/일반파일 모두 메모리 스토리지. 상한은 가장 큰 일반파일 기준,
// 종류별 추가 검증은 핸들러에서.
const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
});

// ============================================
// 미들웨어 — 라운지 멤버십 가드
// ============================================

async function requireLoungeMember(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.isSuperAdmin) {
    req.lounge = { isSuperAdmin: true };
    return next();
  }
  try {
    const ok = await canAccessLounge(prisma, req.user.id);
    if (!ok) {
      return res.status(403).json({
        error: '라운지 접근 권한이 없습니다',
        code: 'NO_LOUNGE_ACCESS',
      });
    }
    req.lounge = { isSuperAdmin: false };
    next();
  } catch (e) {
    next(e);
  }
}

// 작성·반응·신고 등 활동에 필요. 슈퍼어드민도 작성/모더 가능.
router.use(requireLoungeMember);

// ============================================
// 응답 직렬화 헬퍼
// ============================================

// author의 현 컨텍스트 회사 이름을 동적 조회 (showCompanyName=true 글에서만 노출).
// APPROVED 회사 멤버십 중 가장 최근 가입한 회사를 사용.
async function getAuthorCompanyName(client, userId) {
  const m = await client.membership.findFirst({
    where: { userId, company: { approvalStatus: 'APPROVED' } },
    orderBy: { createdAt: 'desc' },
    select: { company: { select: { name: true } } },
  });
  return m?.company?.name || null;
}

async function serializePost(post, opts = {}) {
  const { includeBody = false, currentUserId = null } = opts;
  const out = {
    id: post.id,
    category: post.category,
    title: post.title,
    status: post.status,
    isAnnouncement: post.isAnnouncement || false,
    pinnedToHome: post.pinnedToHome,
    viewCount: post.viewCount || 0,
    reactionCount: post.reactionCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author
      ? {
          id: post.author.id,
          name: post.author.name,
          nickname: post.author.nickname || null,
          selfLabel: post.author.loungeMembership?.selfLabel || null,
          jobRole: post.author.loungeMembership?.jobRole || null,
        }
      : null,
    attachmentCount: post._count?.attachments ?? (post.attachments?.length || 0),
    showCompanyName: post.showCompanyName,
  };
  if (includeBody) out.body = post.body;
  if (post.showCompanyName && post.author?.id) {
    out.companyName = await getAuthorCompanyName(prisma, post.author.id);
  }
  if (currentUserId) {
    const liked = post.reactions
      ? post.reactions.some((r) => r.userId === currentUserId)
      : null;
    if (liked !== null) out.liked = liked;
  }
  return out;
}

function serializeComment(c) {
  return {
    id: c.id,
    body: c.body,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    author: c.author
      ? {
          id: c.author.id,
          name: c.author.name,
          nickname: c.author.nickname || null,
          selfLabel: c.author.loungeMembership?.selfLabel || null,
          jobRole: c.author.loungeMembership?.jobRole || null,
        }
      : null,
  };
}

// ============================================
// GET /api/lounge/categories — 카테고리 메타 + 글 수
// ============================================

router.get('/categories', async (req, res, next) => {
  try {
    const counts = await prisma.loungePost.groupBy({
      by: ['category'],
      where: { status: 'active' },
      _count: { _all: true },
    });
    const countMap = Object.fromEntries(counts.map((c) => [c.category, c._count._all]));
    res.json({
      categories: LOUNGE_CATEGORIES.map((c) => ({
        ...c,
        count: countMap[c.key] || 0,
      })),
    });
  } catch (e) { next(e); }
});

// ============================================
// GET /api/lounge/tags — 화이트리스트 태그 (active만)
// ============================================

// 2026-05-14 태그 시스템 폐기 — 호환을 위해 라우트는 유지하되 빈 배열 반환.
router.get('/tags', async (req, res, next) => {
  res.json({ tags: [] });
});

// ============================================
// GET /api/lounge/me — 본인 라운지 프로필
// ============================================

router.get('/me', async (req, res, next) => {
  try {
    if (req.user.isSuperAdmin) {
      return res.json({
        membership: { status: 'active', selfLabel: null, jobRole: null },
        isSuperAdmin: true,
      });
    }
    const m = await prisma.loungeMembership.findUnique({
      where: { userId: req.user.id },
      select: { status: true, selfLabel: true, jobRole: true, grantedAt: true },
    });
    res.json({ membership: m, isSuperAdmin: false });
  } catch (e) { next(e); }
});

// PATCH /api/lounge/me — selfLabel, jobRole 수정
const meUpdateSchema = z.object({
  selfLabel: z.string().max(40).optional().nullable(),
  jobRole: z.enum(JOB_ROLES).optional().nullable(),
});

router.patch('/me', async (req, res, next) => {
  try {
    if (req.user.isSuperAdmin) {
      return res.status(400).json({ error: '슈퍼어드민은 라운지 멤버십이 없습니다' });
    }
    const data = meUpdateSchema.parse(req.body || {});
    const m = await prisma.loungeMembership.update({
      where: { userId: req.user.id },
      data: {
        ...(data.selfLabel !== undefined ? { selfLabel: data.selfLabel?.trim() || null } : {}),
        ...(data.jobRole !== undefined ? { jobRole: data.jobRole || null } : {}),
      },
      select: { status: true, selfLabel: true, jobRole: true },
    });
    res.json({ membership: m });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// GET /api/lounge/posts — 목록
// query: category, tags(쉼표), search, cursor(=마지막 글 id), limit
// ============================================

router.get('/posts', async (req, res, next) => {
  try {
    const category = (req.query.category || '').toString().trim() || null;
    const search = (req.query.search || '').toString().trim();
    const cursor = (req.query.cursor || '').toString().trim() || null;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    if (category && !LOUNGE_CATEGORY_KEYS.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // 일반 글 (공지 제외) — 카테고리 필터·검색 적용
    const where = { status: 'active', isAnnouncement: false };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    const postsInclude = {
      author: {
        select: {
          id: true,
          name: true,
          nickname: true,
          loungeMembership: { select: { selfLabel: true, jobRole: true } },
        },
      },
      _count: { select: { attachments: true } },
    };

    const posts = await prisma.loungePost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: postsInclude,
    });

    const hasMore = posts.length > limit;
    const sliced = hasMore ? posts.slice(0, limit) : posts;
    const items = await Promise.all(sliced.map((p) => serializePost(p)));

    // 공지글 — 첫 페이지(cursor 없을 때)에만 별도 배열로. 카테고리 무관 모두 노출.
    let announcements = [];
    if (!cursor) {
      const annPosts = await prisma.loungePost.findMany({
        where: { status: 'active', isAnnouncement: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: postsInclude,
      });
      announcements = await Promise.all(annPosts.map((p) => serializePost(p)));
    }

    res.json({
      items,
      announcements,
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    });
  } catch (e) { next(e); }
});

// ============================================
// POST /api/lounge/posts — 작성
// ============================================

const postCreateSchema = z.object({
  category: z.enum(LOUNGE_CATEGORY_KEYS),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
  showCompanyName: z.boolean().optional().default(false),
  isAnnouncement: z.boolean().optional().default(false),
});

router.post('/posts', async (req, res, next) => {
  try {
    const data = postCreateSchema.parse(req.body || {});

    // 공지 글은 슈퍼어드민만 — 카테고리 무관, 모든 목록 상단 핀
    if (data.isAnnouncement && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: '공지 글은 운영자만 작성할 수 있습니다' });
    }

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.loungePost.create({
        data: {
          authorId: req.user.id,
          category: data.category,
          title: data.title.trim(),
          body: data.body,
          showCompanyName: data.showCompanyName,
          isAnnouncement: data.isAnnouncement,
        },
      });
      return created;
    });

    const full = await prisma.loungePost.findUnique({
      where: { id: post.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
      },
    });
    res.status(201).json({ post: await serializePost(full, { includeBody: true }) });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// GET /api/lounge/posts/:id — 상세 (+ 댓글)
// ============================================

router.get('/posts/:id', async (req, res, next) => {
  try {
    const post = await prisma.loungePost.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
        reactions: { where: { userId: req.user.id }, select: { userId: true } },
        _count: { select: { attachments: true } },
      },
    });
    if (!post || post.status === 'deleted') {
      return res.status(404).json({ error: '글을 찾을 수 없습니다' });
    }
    if (post.status === 'hidden' && !req.user.isSuperAdmin && post.authorId !== req.user.id) {
      return res.status(404).json({ error: '글을 찾을 수 없습니다' });
    }

    // 조회수 증가 — 작성자 본인은 제외. 비동기 (응답 지연 방지)
    if (post.authorId !== req.user.id) {
      prisma.loungePost
        .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
        .catch(() => {});
      post.viewCount = (post.viewCount || 0) + 1;
    }

    const comments = await prisma.loungeComment.findMany({
      where: { postId: post.id, status: 'active' },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
      },
    });

    res.json({
      post: await serializePost(post, { includeBody: true, currentUserId: req.user.id }),
      comments: comments.map(serializeComment),
    });
  } catch (e) { next(e); }
});

// ============================================
// PATCH /api/lounge/posts/:id — 수정 (본인 + 슈퍼어드민)
// ============================================

const postUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(50000).optional(),
  showCompanyName: z.boolean().optional(),
  isAnnouncement: z.boolean().optional(),
});

router.patch('/posts/:id', async (req, res, next) => {
  try {
    const data = postUpdateSchema.parse(req.body || {});
    const post = await prisma.loungePost.findUnique({ where: { id: req.params.id } });
    if (!post || post.status === 'deleted') {
      return res.status(404).json({ error: '글을 찾을 수 없습니다' });
    }
    if (post.authorId !== req.user.id && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: '본인 글만 수정할 수 있습니다' });
    }
    // 공지 토글은 슈퍼어드민만
    if (data.isAnnouncement !== undefined && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: '공지 토글은 운영자만 가능합니다' });
    }

    await prisma.loungePost.update({
      where: { id: post.id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.body !== undefined ? { body: data.body } : {}),
        ...(data.showCompanyName !== undefined ? { showCompanyName: data.showCompanyName } : {}),
        ...(data.isAnnouncement !== undefined ? { isAnnouncement: data.isAnnouncement } : {}),
      },
    });

    const full = await prisma.loungePost.findUnique({
      where: { id: post.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
      },
    });
    res.json({ post: await serializePost(full, { includeBody: true }) });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// DELETE /api/lounge/posts/:id — soft delete
// ============================================

router.delete('/posts/:id', async (req, res, next) => {
  try {
    const post = await prisma.loungePost.findUnique({ where: { id: req.params.id } });
    if (!post || post.status === 'deleted') {
      return res.status(404).json({ error: '글을 찾을 수 없습니다' });
    }
    if (post.authorId !== req.user.id && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: '본인 글만 삭제할 수 있습니다' });
    }
    await prisma.loungePost.update({
      where: { id: post.id },
      data: { status: 'deleted' },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================
// POST /api/lounge/posts/:id/comments — 댓글 작성
// ============================================

const commentCreateSchema = z.object({
  body: z.string().min(1).max(5000),
});

router.post('/posts/:id/comments', async (req, res, next) => {
  try {
    const data = commentCreateSchema.parse(req.body || {});
    const post = await prisma.loungePost.findUnique({ where: { id: req.params.id } });
    if (!post || post.status !== 'active') {
      return res.status(404).json({ error: '글을 찾을 수 없습니다' });
    }

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.loungeComment.create({
        data: { postId: post.id, authorId: req.user.id, body: data.body },
      });
      await tx.loungePost.update({
        where: { id: post.id },
        data: { commentCount: { increment: 1 } },
      });
      return c;
    });

    const full = await prisma.loungeComment.findUnique({
      where: { id: comment.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
      },
    });
    res.status(201).json({ comment: serializeComment(full) });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// PATCH /api/lounge/comments/:id — 수정
// ============================================

const commentUpdateSchema = z.object({
  body: z.string().min(1).max(5000),
});

router.patch('/comments/:id', async (req, res, next) => {
  try {
    const data = commentUpdateSchema.parse(req.body || {});
    const c = await prisma.loungeComment.findUnique({ where: { id: req.params.id } });
    if (!c || c.status === 'deleted') {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다' });
    }
    if (c.authorId !== req.user.id && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: '본인 댓글만 수정할 수 있습니다' });
    }
    const updated = await prisma.loungeComment.update({
      where: { id: c.id },
      data: { body: data.body },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
      },
    });
    res.json({ comment: serializeComment(updated) });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// DELETE /api/lounge/comments/:id — soft delete
// ============================================

router.delete('/comments/:id', async (req, res, next) => {
  try {
    const c = await prisma.loungeComment.findUnique({ where: { id: req.params.id } });
    if (!c || c.status === 'deleted') {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다' });
    }
    if (c.authorId !== req.user.id && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: '본인 댓글만 삭제할 수 있습니다' });
    }
    await prisma.$transaction(async (tx) => {
      await tx.loungeComment.update({ where: { id: c.id }, data: { status: 'deleted' } });
      await tx.loungePost.update({
        where: { id: c.postId },
        data: { commentCount: { decrement: 1 } },
      });
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================
// POST /api/lounge/posts/:id/reactions — 공감 토글
// ============================================

router.post('/posts/:id/reactions', async (req, res, next) => {
  try {
    const post = await prisma.loungePost.findUnique({ where: { id: req.params.id } });
    if (!post || post.status !== 'active') {
      return res.status(404).json({ error: '글을 찾을 수 없습니다' });
    }
    const existing = await prisma.loungeReaction.findUnique({
      where: { postId_userId: { postId: post.id, userId: req.user.id } },
    });

    const result = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.loungeReaction.delete({ where: { id: existing.id } });
        const updated = await tx.loungePost.update({
          where: { id: post.id },
          data: { reactionCount: { decrement: 1 } },
          select: { reactionCount: true },
        });
        return { liked: false, count: updated.reactionCount };
      }
      await tx.loungeReaction.create({
        data: { postId: post.id, userId: req.user.id },
      });
      const updated = await tx.loungePost.update({
        where: { id: post.id },
        data: { reactionCount: { increment: 1 } },
        select: { reactionCount: true },
      });
      return { liked: true, count: updated.reactionCount };
    });
    res.json(result);
  } catch (e) { next(e); }
});

// ============================================
// POST /api/lounge/posts/:id/reports — 글 신고
// POST /api/lounge/comments/:id/reports — 댓글 신고
// ============================================

const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  detail: z.string().max(2000).optional().nullable(),
});

async function createReport(req, res, next, targetType) {
  try {
    const data = reportSchema.parse(req.body || {});
    const targetId = req.params.id;

    if (targetType === 'post') {
      const p = await prisma.loungePost.findUnique({ where: { id: targetId } });
      if (!p) return res.status(404).json({ error: '대상을 찾을 수 없습니다' });
    } else {
      const c = await prisma.loungeComment.findUnique({ where: { id: targetId } });
      if (!c) return res.status(404).json({ error: '대상을 찾을 수 없습니다' });
    }

    const report = await prisma.loungeReport.create({
      data: {
        targetType,
        targetId,
        reporterId: req.user.id,
        reason: data.reason,
        detail: data.detail || null,
      },
    });
    res.status(201).json({ ok: true, reportId: report.id });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
}

router.post('/posts/:id/reports', (req, res, next) => createReport(req, res, next, 'post'));
router.post('/comments/:id/reports', (req, res, next) => createReport(req, res, next, 'comment'));

// ============================================
// 첨부 — POST /api/lounge/posts/:id/attachments (multipart, files[])
// kind: image | ruby | file. 본인 글에만 첨부 가능.
// - 이미지 5MB · 글당 5장
// - .rb     1MB · 글당 3개
// - 일반파일 20MB · 글당 5개 (실행파일 확장자 차단)
// ============================================

router.post('/posts/:id/attachments', attachmentUpload.array('files', 5), async (req, res, next) => {
  try {
    const post = await prisma.loungePost.findUnique({
      where: { id: req.params.id },
      include: { attachments: { select: { id: true, kind: true } } },
    });
    if (!post || post.status === 'deleted') {
      return res.status(404).json({ error: '글을 찾을 수 없습니다' });
    }
    if (post.authorId !== req.user.id && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: '본인 글에만 첨부할 수 있습니다' });
    }
    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ error: '파일이 없습니다' });

    const kind = (req.body.kind || 'image').toString();
    if (!['image', 'ruby', 'file'].includes(kind)) {
      return res.status(400).json({ error: 'kind는 image, ruby, file 중 하나여야 합니다' });
    }
    if (!isConfigured()) {
      return res.status(503).json({ error: 'Cloudinary가 설정되지 않았습니다' });
    }

    // 글당 첨부 개수 제한
    const existing = post.attachments.filter((a) => a.kind === kind).length;
    const maxByKind = { image: MAX_IMAGES_PER_POST, ruby: MAX_RUBY_PER_POST, file: MAX_FILES_PER_POST };
    const labelByKind = { image: '이미지', ruby: '.rb', file: '파일' };
    const max = maxByKind[kind];
    if (existing + files.length > max) {
      return res.status(400).json({
        error: `${labelByKind[kind]}은(는) 글당 ${max}개까지 첨부 가능합니다 (현재 ${existing}개)`,
      });
    }

    if (kind === 'ruby') {
      for (const f of files) {
        if (f.size > MAX_RUBY_SIZE) {
          return res.status(400).json({ error: `.rb 파일은 최대 ${MAX_RUBY_SIZE / 1024 / 1024}MB까지 가능합니다 (${f.originalname})` });
        }
        const lower = (f.originalname || '').toLowerCase();
        if (!lower.endsWith('.rb')) {
          return res.status(400).json({ error: `.rb 확장자만 허용됩니다 (${f.originalname})` });
        }
      }
    } else if (kind === 'image') {
      // multer가 이미 fileSize 제한 — 다만 일반파일과 다른 별도 상한이므로 추가 검사
      for (const f of files) {
        if (f.size > MAX_IMAGE_SIZE) {
          return res.status(400).json({ error: `이미지는 최대 ${MAX_IMAGE_SIZE / 1024 / 1024}MB까지 가능합니다 (${f.originalname})` });
        }
        if (!/^image\//.test(f.mimetype || '')) {
          return res.status(400).json({ error: `이미지 파일만 허용됩니다 (${f.originalname})` });
        }
      }
    } else {
      // file — 실행파일 확장자 차단, 20MB 상한 (multer가 이미 적용)
      for (const f of files) {
        const lower = (f.originalname || '').toLowerCase();
        const dotIdx = lower.lastIndexOf('.');
        const ext = dotIdx >= 0 ? lower.slice(dotIdx) : '';
        if (BLOCKED_FILE_EXTS.includes(ext)) {
          return res.status(400).json({
            error: `실행파일은 첨부할 수 없습니다 (${f.originalname})`,
          });
        }
        // 이미지 MIME이면 image kind로 올리도록 안내
        if (/^image\//.test(f.mimetype || '')) {
          return res.status(400).json({
            error: `이미지는 "이미지 첨부" 버튼으로 올려주세요 (${f.originalname})`,
          });
        }
      }
    }

    const folder = `suplex/lounge/${post.id}/${kind}`;
    const created = [];
    for (const f of files) {
      let storageKey;
      if (kind === 'image') {
        const r = await uploadBuffer(f.buffer, { folder });
        storageKey = r.publicId;
      } else {
        // ruby + file 모두 raw 업로드
        const r = await uploadRawBuffer(f.buffer, { folder });
        storageKey = r.publicId;
      }
      const att = await prisma.loungeAttachment.create({
        data: {
          postId: post.id,
          kind,
          fileName: f.originalname || 'file',
          fileSize: f.size,
          storageKey,
          mimeType: f.mimetype || null,
        },
      });
      created.push(att);
    }
    res.status(201).json({ attachments: created });
  } catch (e) {
    if (e.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일 크기 제한 초과' });
    }
    next(e);
  }
});

// GET /api/lounge/posts/:id/attachments — 첨부 목록 (이미지 url 포함)
router.get('/posts/:id/attachments', async (req, res, next) => {
  try {
    const post = await prisma.loungePost.findUnique({ where: { id: req.params.id } });
    if (!post || post.status === 'deleted') {
      return res.status(404).json({ error: '글을 찾을 수 없습니다' });
    }
    const items = await prisma.loungeAttachment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, kind: true, fileName: true, fileSize: true, storageKey: true, downloadCount: true, createdAt: true },
    });
    // 이미지는 Cloudinary 이미지 URL을 그대로 노출. .rb/일반파일은 다운로드 엔드포인트 경유(카운트 + 원본명 보존).
    const cloudName = require('../config/env').cloudinary.cloudName;
    const out = items.map((a) => ({
      id: a.id,
      kind: a.kind,
      fileName: a.fileName,
      fileSize: a.fileSize,
      downloadCount: a.downloadCount,
      createdAt: a.createdAt,
      url:
        a.kind === 'image' && cloudName
          ? `https://res.cloudinary.com/${cloudName}/image/upload/${a.storageKey}`
          : null,
    }));
    res.json({ attachments: out });
  } catch (e) { next(e); }
});

// GET /api/lounge/attachments/:id/download — .rb / 일반파일 다운로드 URL + 카운트
router.get('/attachments/:id/download', async (req, res, next) => {
  try {
    const a = await prisma.loungeAttachment.findUnique({ where: { id: req.params.id } });
    if (!a) return res.status(404).json({ error: '첨부를 찾을 수 없습니다' });
    if (a.kind === 'image') {
      return res.status(400).json({ error: '이미지는 url을 직접 사용하세요' });
    }
    await prisma.loungeAttachment.update({
      where: { id: a.id },
      data: { downloadCount: { increment: 1 } },
    });
    const cloudName = require('../config/env').cloudinary.cloudName;
    if (!cloudName) return res.status(503).json({ error: 'Cloudinary 미설정' });
    // ruby + file 모두 raw 리소스로 업로드되어 있음
    const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${a.storageKey}`;
    res.json({ url, fileName: a.fileName });
  } catch (e) { next(e); }
});

// DELETE /api/lounge/attachments/:id — 첨부 삭제 (본인 글 + 슈퍼어드민)
router.delete('/attachments/:id', async (req, res, next) => {
  try {
    const a = await prisma.loungeAttachment.findUnique({
      where: { id: req.params.id },
      include: { post: { select: { authorId: true } } },
    });
    if (!a) return res.status(404).json({ error: '첨부를 찾을 수 없습니다' });
    if (a.post.authorId !== req.user.id && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: '본인 첨부만 삭제할 수 있습니다' });
    }
    if (a.kind === 'image') await deleteByPublicId(a.storageKey);
    else await deleteRawByPublicId(a.storageKey); // ruby + file
    await prisma.loungeAttachment.delete({ where: { id: a.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================
// GET /api/lounge/home-pinned — 홈 "오늘의 팁" 카드 1개
// 1순위: pinnedToHome=true (가장 최근). 2순위: usage 카테고리 최근 7일 + reactionCount 1+ 인기글.
// 라운지 멤버십 없는 사용자도 호출할 수 있도록 별도 분기 필요 — v1엔 멤버만.
// ============================================

router.get('/home-pinned', async (req, res, next) => {
  try {
    // 1순위: 슈퍼어드민이 명시 핀한 글. 2순위: 최근 활성 공지(isAnnouncement)
    let post = await prisma.loungePost.findFirst({
      where: { pinnedToHome: true, status: 'active' },
      orderBy: { homePinnedAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
      },
    });

    if (!post) {
      post = await prisma.loungePost.findFirst({
        where: { status: 'active', isAnnouncement: true },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              nickname: true,
              loungeMembership: { select: { selfLabel: true, jobRole: true } },
            },
          },
        },
      });
    }

    if (!post) return res.json({ post: null });
    const serialized = await serializePost(post, { includeBody: true });
    // 본문은 80자만 잘라서 반환 (홈 카드 표시용)
    if (serialized.body) {
      const stripped = serialized.body.replace(/```[\s\S]*?```/g, '').replace(/\s+/g, ' ').trim();
      serialized.preview = stripped.length > 80 ? stripped.slice(0, 80) + '…' : stripped;
    }
    res.json({ post: serialized });
  } catch (e) { next(e); }
});

module.exports = router;
