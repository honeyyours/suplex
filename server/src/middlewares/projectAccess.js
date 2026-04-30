// 프로젝트별 가시성 가드 — 오픈 디폴트 (2026-04-30 변경)
//
// 정책:
//   - 가시성·작업: 같은 회사 멤버라면 모든 프로젝트 접근 가능 (오픈 디폴트)
//   - LEAD 전용 액션 (멤버 추가/제거, 프로젝트 DELETE 등): OWNER 또는 LEAD만
//   - ProjectMember 테이블은 보존: LEAD 지정 + 정식 출시 후 "팀 단위 분리" 진화 경로
//
// 변경 사유: 베타 단계의 인테리어 1~10인 소규모 회사에선 프로젝트별 멤버십을
// 일일이 지정하기 부담. "팀별로 갈라지는 회사"가 흔하지 않아, 디폴트는 모두에게
// 보이게 하고, 나중에 팀 단위 분리(Team 모델 + 프로젝트 생성 시 팀 지정)는
// 정식 출시 작업으로 이동.
//
// authRequired 다음에 와야 함 (req.user 사용).

const prisma = require('../config/prisma');

// 오픈 디폴트: null = 제한 없음 (companyId 일치만 별도로 체크).
// 정식 출시 후 팀 단위 분리 도입 시 이 함수에서 팀 멤버 projectId 필터링.
async function getAccessibleProjectIds(req) {
  if (!req.user) return [];
  return null;
}

// 같은 회사 프로젝트인지 + LEAD 식별만. 멤버십 없어도 접근 허용 (오픈 디폴트).
async function checkProjectAccess(req, res, projectId) {
  if (!projectId) {
    res.status(400).json({ error: 'projectId required' });
    return false;
  }

  const p = await prisma.project.findFirst({
    where: { id: projectId, companyId: req.user.companyId },
    select: { id: true },
  });
  if (!p) {
    res.status(404).json({ error: 'Project not found' });
    return false;
  }

  // LEAD 식별 (downstream DELETE 등에서 사용). OWNER는 룰 우회라 조회 생략.
  if (req.user.role !== 'OWNER') {
    try {
      const member = await prisma.projectMember.findFirst({
        where: { projectId, userId: req.user.id },
        select: { role: true },
      });
      if (member) req.projectMemberRole = member.role;
    } catch (e) { /* 폴백 — 마이그 미적용 환경 무시 */ }
  }
  return true;
}

// 미들웨어: 같은 회사 프로젝트면 통과 (오픈 디폴트).
function requireProjectMember(idParam = 'id') {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const projectId = req.params[idParam];
    const ok = await checkProjectAccess(req, res, projectId);
    if (!ok) return;
    next();
  };
}

// LEAD 전용 (멤버 추가/제거, DELETE 등). OWNER 우회. 그 외엔 명시 LEAD ProjectMember 필요.
function requireProjectLead(idParam = 'id') {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const projectId = req.params[idParam];

    const p = await prisma.project.findFirst({
      where: { id: projectId, companyId: req.user.companyId },
      select: { id: true },
    });
    if (!p) return res.status(404).json({ error: 'Project not found' });

    if (req.user.role === 'OWNER') return next();

    try {
      const member = await prisma.projectMember.findFirst({
        where: { projectId, userId: req.user.id, role: 'LEAD' },
        select: { id: true },
      });
      if (!member) return res.status(403).json({ error: 'Forbidden — LEAD only' });
      req.projectMemberRole = 'LEAD';
      return next();
    } catch (e) {
      return res.status(403).json({ error: 'Forbidden — LEAD only' });
    }
  };
}

module.exports = {
  getAccessibleProjectIds,
  checkProjectAccess,
  requireProjectMember,
  requireProjectLead,
};
