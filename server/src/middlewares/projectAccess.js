// 프로젝트별 가시성 가드.
// 정책 (메모리 `수플렉스_규칙_출구정리.md` Step 2~4):
//   - OWNER: 모든 회사 프로젝트 풀권한 (ProjectMember 행 없어도 우회)
//   - DESIGNER/FIELD: ProjectMember 행이 있는 프로젝트만 보기·작업
//   - 회사 격리: 항상 companyId 일치 확인 (멀티테넌시)
//
// authRequired 다음에 와야 함 (req.user 사용).

const prisma = require('../config/prisma');

// 사용자가 접근 가능한 projectId 리스트.
// OWNER → null (제한 없음 = 전체 회사 프로젝트). 그 외 → 멤버인 projectId 배열.
async function getAccessibleProjectIds(req) {
  if (!req.user) return [];
  if (req.user.role === 'OWNER') return null;
  try {
    const memberships = await prisma.projectMember.findMany({
      where: {
        userId: req.user.id,
        project: { companyId: req.user.companyId },
      },
      select: { projectId: true },
    });
    return memberships.map((m) => m.projectId);
  } catch (e) {
    // project_members 테이블 미존재(마이그 미적용) — 폴백: 전체 허용
    return null;
  }
}

// 사용자가 그 프로젝트에 접근 가능한지 확인. 없으면 res 처리하고 false.
async function checkProjectAccess(req, res, projectId) {
  if (!projectId) {
    res.status(400).json({ error: 'projectId required' });
    return false;
  }

  // OWNER는 회사 소속만 확인
  if (req.user.role === 'OWNER') {
    const p = await prisma.project.findFirst({
      where: { id: projectId, companyId: req.user.companyId },
      select: { id: true },
    });
    if (!p) {
      res.status(404).json({ error: 'Project not found' });
      return false;
    }
    return true;
  }

  // DESIGNER/FIELD — 멤버십 체크
  try {
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: req.user.id,
        project: { companyId: req.user.companyId },
      },
      select: { id: true, role: true },
    });
    if (!member) {
      res.status(403).json({ error: 'Forbidden — not a project member', forbidden: 'project_member' });
      return false;
    }
    req.projectMemberRole = member.role; // LEAD / MEMBER — 후속 핸들러에서 활용
    return true;
  } catch (e) {
    // 테이블 미존재 폴백 — 회사 소속만 확인
    const p = await prisma.project.findFirst({
      where: { id: projectId, companyId: req.user.companyId },
      select: { id: true },
    });
    if (!p) {
      res.status(404).json({ error: 'Project not found' });
      return false;
    }
    return true;
  }
}

// 미들웨어: req.params[idParam]의 projectId로 접근 체크.
function requireProjectMember(idParam = 'id') {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const projectId = req.params[idParam];
    const ok = await checkProjectAccess(req, res, projectId);
    if (!ok) return;
    next();
  };
}

// LEAD만 허용 (멤버 추가/제거 등). OWNER는 우회.
function requireProjectLead(idParam = 'id') {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === 'OWNER') {
      // 회사 소속만 확인하고 통과
      const projectId = req.params[idParam];
      const p = await prisma.project.findFirst({
        where: { id: projectId, companyId: req.user.companyId },
        select: { id: true },
      });
      if (!p) return res.status(404).json({ error: 'Project not found' });
      return next();
    }
    const projectId = req.params[idParam];
    const ok = await checkProjectAccess(req, res, projectId);
    if (!ok) return;
    if (req.projectMemberRole !== 'LEAD') {
      return res.status(403).json({ error: 'Forbidden — LEAD only' });
    }
    next();
  };
}

module.exports = {
  getAccessibleProjectIds,
  checkProjectAccess,
  requireProjectMember,
  requireProjectLead,
};
