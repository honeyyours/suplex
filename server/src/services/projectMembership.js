// 프로젝트 멤버십 자동 합류 정책 (2026-05-14):
// "회사 모든 직원은 디폴트로 모든 프로젝트의 멤버."
// LEAD가 팀 관리 모달에서 개별 제거 가능(예외 처리는 유지) — 디폴트만 전체 참가.

// 신규 프로젝트 생성 시 — 회사 전체 멤버를 한 번에 합류시킴.
// leadUserId 한 명만 LEAD, 나머지는 MEMBER. 기존 ProjectMember 행이 있어도 skipDuplicates로 안전.
async function addAllCompanyUsersToProject(tx, { projectId, companyId, leadUserId }) {
  const memberships = await tx.membership.findMany({
    where: { companyId },
    select: { userId: true },
  });
  if (memberships.length === 0) return 0;

  const rows = memberships.map((m) => ({
    projectId,
    userId: m.userId,
    role: m.userId === leadUserId ? 'LEAD' : 'MEMBER',
  }));
  const result = await tx.projectMember.createMany({ data: rows, skipDuplicates: true });
  return result.count;
}

// 신규 직원이 회사에 합류할 때 — 그 회사의 모든 기존 프로젝트에 MEMBER로 자동 추가.
// status 무관 전부(COMPLETED/CANCELLED 포함) — 명단은 사고 기록으로도 가치 있음.
async function addUserToAllCompanyProjects(tx, { userId, companyId }) {
  const projects = await tx.project.findMany({
    where: { companyId },
    select: { id: true },
  });
  if (projects.length === 0) return 0;

  const rows = projects.map((p) => ({
    projectId: p.id,
    userId,
    role: 'MEMBER',
  }));
  const result = await tx.projectMember.createMany({ data: rows, skipDuplicates: true });
  return result.count;
}

module.exports = {
  addAllCompanyUsersToProject,
  addUserToAllCompanyProjects,
};
