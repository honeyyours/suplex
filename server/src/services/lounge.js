// 라운지(커뮤니티) 도메인 서비스 — docs/커뮤니티_기획서.md
//
// 핵심 정책: LoungeMembership은 User 단위. 한 번이라도 APPROVED 회사에 속하면 부여되고,
// 그 회사를 떠나도 라운지 활동은 유지된다(인테리어 생태계 자산화).

// 2026-05-14 축소: 6→3 카테고리. 공지는 별도 카테고리 X — isAnnouncement 플래그로 모든 목록 상단 핀.
// 라벨 재조정 (2026-05-14 v2): 자유잡담→자유대화, 요청사항→루비 및 프로그램 피드백.
// 2026-05-15: 루비 및 프로그램 피드백 → 피드백 (단축)
const LOUNGE_CATEGORIES = [
  { key: 'free', label: '자유대화', staffOnly: false, sortOrder: 10 },
  { key: 'ruby', label: '루비', staffOnly: false, sortOrder: 20 },
  { key: 'request', label: '피드백', staffOnly: false, sortOrder: 30 },
];

const LOUNGE_CATEGORY_KEYS = LOUNGE_CATEGORIES.map((c) => c.key);

// 태그 시스템 폐기 (2026-05-14). 기존 DB의 LoungeTag/LoungePostTag 레코드는 보존되나 신규 시드 X.
// 글쓰기 UI에서 태그 선택 제거, GET /tags는 빈 배열, POST /posts에서 tagIds 무시.
const LOUNGE_TAGS_SEED = [];

// 멱등 부여: userId가 이미 라운지 멤버면 noop, 아니면 신규 생성.
// 호출하는 쪽에서 회사 상태가 APPROVED라는 걸 보장한 경우 사용.
async function ensureLoungeMembership(client, userId, reason) {
  if (!userId) return null;
  return client.loungeMembership.upsert({
    where: { userId },
    create: {
      userId,
      status: 'active',
      grantedReason: reason || 'auto',
    },
    update: {},
  });
}

// 회사 상태 확인 후 부여. companyId의 status가 APPROVED일 때만 ensure.
// SUSPENDED/REJECTED 회사 멤버에게는 부여하지 않음(아직 자격 없음).
async function grantIfCompanyApproved(client, userId, companyId, reason) {
  if (!userId || !companyId) return false;
  const co = await client.company.findUnique({
    where: { id: companyId },
    select: { approvalStatus: true, name: true },
  });
  if (!co || co.approvalStatus !== 'APPROVED') return false;
  await ensureLoungeMembership(client, userId, reason || `회사 ${co.name} 합류`);
  return true;
}

// 회사 1개의 모든 멤버에게 부여 — 회사 승인 시점 호출.
async function grantLoungeMembershipsForCompany(client, companyId, reason) {
  const memberships = await client.membership.findMany({
    where: { companyId },
    select: { userId: true },
  });
  let granted = 0;
  for (const m of memberships) {
    await ensureLoungeMembership(client, m.userId, reason || `회사 승인 (${companyId})`);
    granted += 1;
  }
  return granted;
}

// 일괄 보강 — 모든 회사 멤버 중 라운지 멤버십 미보유자 부여.
// 2026-05-14 변경: 회사 승인 여부와 무관. 베타 진입 통제(approvalStatus)는 라운지 외 메뉴에만 적용.
// 어드민 endpoint와 boot 시 1회 호출 가능.
async function backfillLoungeMemberships(client) {
  const memberships = await client.membership.findMany({
    select: { userId: true, companyId: true },
  });
  const seen = new Set();
  let granted = 0;
  for (const m of memberships) {
    if (seen.has(m.userId)) continue;
    seen.add(m.userId);
    const before = await client.loungeMembership.findUnique({ where: { userId: m.userId } });
    if (before) continue;
    await ensureLoungeMembership(client, m.userId, `backfill (회사 ${m.companyId})`);
    granted += 1;
  }
  return { scanned: seen.size, granted };
}

// 태그 화이트리스트 멱등 시드 — boot 시 1회 호출.
async function seedLoungeTags(client) {
  for (const t of LOUNGE_TAGS_SEED) {
    await client.loungeTag.upsert({
      where: { key: t.key },
      create: t,
      update: { label: t.label, kind: t.kind, sortOrder: t.sortOrder },
    });
  }
  return LOUNGE_TAGS_SEED.length;
}

// 사용자가 라운지에 접근 가능한가? (현·전직 모두 OK)
async function canAccessLounge(client, userId) {
  if (!userId) return false;
  const m = await client.loungeMembership.findUnique({
    where: { userId },
    select: { status: true },
  });
  return Boolean(m && m.status === 'active');
}

module.exports = {
  LOUNGE_CATEGORIES,
  LOUNGE_CATEGORY_KEYS,
  LOUNGE_TAGS_SEED,
  ensureLoungeMembership,
  grantIfCompanyApproved,
  grantLoungeMembershipsForCompany,
  backfillLoungeMemberships,
  seedLoungeTags,
  canAccessLounge,
};
