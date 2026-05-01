// 라운지(커뮤니티) API — docs/커뮤니티_기획서.md
//
// 베타 진입 통제(requireApprovedCompany)를 우회하도록 routes/index.js에서 분기됨.
// 라운지 자체 가드: requireLoungeMember (LoungeMembership.status === 'active').
// 슈퍼어드민은 우회.
//
// v1 범위: 카테고리/태그 조회, 글·댓글·공감·신고 CRUD, 홈 카드, 본인 프로필.
// 첨부(이미지/.rb)는 task #8에서 추가.

const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const {
  LOUNGE_CATEGORIES,
  LOUNGE_CATEGORY_KEYS,
  canAccessLounge,
} = require('../services/lounge');

const router = express.Router();
router.use(authRequired);

const REPORT_REASONS = ['spam', 'abuse', 'client_info', 'malicious_code', 'other'];
const JOB_ROLES = ['designer', 'site', 'ops', 'etc'];

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
    pinnedToHome: post.pinnedToHome,
    reactionCount: post.reactionCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author
      ? {
          id: post.author.id,
          name: post.author.name,
          selfLabel: post.author.loungeMembership?.selfLabel || null,
          jobRole: post.author.loungeMembership?.jobRole || null,
        }
      : null,
    tags: (post.tags || []).map((pt) => ({
      key: pt.tag.key,
      label: pt.tag.label,
      kind: pt.tag.kind,
    })),
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

router.get('/tags', async (req, res, next) => {
  try {
    const tags = await prisma.loungeTag.findMany({
      where: { isActive: true },
      orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }],
      select: { id: true, key: true, label: true, kind: true },
    });
    res.json({ tags });
  } catch (e) { next(e); }
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
    const tagsParam = (req.query.tags || '').toString().trim();
    const search = (req.query.search || '').toString().trim();
    const cursor = (req.query.cursor || '').toString().trim() || null;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    if (category && !LOUNGE_CATEGORY_KEYS.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    const tagKeys = tagsParam ? tagsParam.split(',').map((s) => s.trim()).filter(Boolean) : [];

    const where = { status: 'active' };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tagKeys.length > 0) {
      where.tags = { some: { tag: { key: { in: tagKeys } } } };
    }

    const posts = await prisma.loungePost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: {
          select: {
            id: true,
            name: true,
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
        tags: { include: { tag: true } },
        _count: { select: { attachments: true } },
      },
    });

    const hasMore = posts.length > limit;
    const sliced = hasMore ? posts.slice(0, limit) : posts;
    const items = await Promise.all(sliced.map((p) => serializePost(p)));

    res.json({
      items,
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
  tagIds: z.array(z.string()).max(3).optional().default([]),
});

router.post('/posts', async (req, res, next) => {
  try {
    const data = postCreateSchema.parse(req.body || {});

    // 공지 카테고리는 슈퍼어드민만
    if (data.category === 'notice' && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: '공지 카테고리는 운영자만 작성할 수 있습니다' });
    }

    // 태그 화이트리스트 검증
    if (data.tagIds.length > 0) {
      const tagsExist = await prisma.loungeTag.findMany({
        where: { id: { in: data.tagIds }, isActive: true },
        select: { id: true },
      });
      if (tagsExist.length !== data.tagIds.length) {
        return res.status(400).json({ error: '유효하지 않은 태그가 포함되어 있습니다' });
      }
    }

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.loungePost.create({
        data: {
          authorId: req.user.id,
          category: data.category,
          title: data.title.trim(),
          body: data.body,
          showCompanyName: data.showCompanyName,
        },
      });
      if (data.tagIds.length > 0) {
        await tx.loungePostTag.createMany({
          data: data.tagIds.map((tagId) => ({ postId: created.id, tagId })),
          skipDuplicates: true,
        });
      }
      return created;
    });

    const full = await prisma.loungePost.findUnique({
      where: { id: post.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
        tags: { include: { tag: true } },
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
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
        tags: { include: { tag: true } },
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

    const comments = await prisma.loungeComment.findMany({
      where: { postId: post.id, status: 'active' },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
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
  tagIds: z.array(z.string()).max(3).optional(),
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

    if (data.tagIds && data.tagIds.length > 0) {
      const tagsExist = await prisma.loungeTag.findMany({
        where: { id: { in: data.tagIds }, isActive: true },
        select: { id: true },
      });
      if (tagsExist.length !== data.tagIds.length) {
        return res.status(400).json({ error: '유효하지 않은 태그가 포함되어 있습니다' });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.loungePost.update({
        where: { id: post.id },
        data: {
          ...(data.title !== undefined ? { title: data.title.trim() } : {}),
          ...(data.body !== undefined ? { body: data.body } : {}),
          ...(data.showCompanyName !== undefined ? { showCompanyName: data.showCompanyName } : {}),
        },
      });
      if (data.tagIds) {
        await tx.loungePostTag.deleteMany({ where: { postId: post.id } });
        if (data.tagIds.length > 0) {
          await tx.loungePostTag.createMany({
            data: data.tagIds.map((tagId) => ({ postId: post.id, tagId })),
            skipDuplicates: true,
          });
        }
      }
    });

    const full = await prisma.loungePost.findUnique({
      where: { id: post.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
        tags: { include: { tag: true } },
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
// GET /api/lounge/home-pinned — 홈 "오늘의 팁" 카드 1개
// 1순위: pinnedToHome=true (가장 최근). 2순위: usage 카테고리 최근 7일 + reactionCount 1+ 인기글.
// 라운지 멤버십 없는 사용자도 호출할 수 있도록 별도 분기 필요 — v1엔 멤버만.
// ============================================

router.get('/home-pinned', async (req, res, next) => {
  try {
    let post = await prisma.loungePost.findFirst({
      where: { pinnedToHome: true, status: 'active' },
      orderBy: { homePinnedAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            loungeMembership: { select: { selfLabel: true, jobRole: true } },
          },
        },
        tags: { include: { tag: true } },
      },
    });

    if (!post) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      post = await prisma.loungePost.findFirst({
        where: {
          status: 'active',
          category: 'usage',
          createdAt: { gte: sevenDaysAgo },
          reactionCount: { gte: 1 },
        },
        orderBy: [{ reactionCount: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: {
            select: {
              id: true,
              name: true,
              loungeMembership: { select: { selfLabel: true, jobRole: true } },
            },
          },
          tags: { include: { tag: true } },
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
