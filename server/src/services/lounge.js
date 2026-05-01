// 라운지(커뮤니티) 도메인 서비스 — docs/커뮤니티_기획서.md
//
// 핵심 정책: LoungeMembership은 User 단위. 한 번이라도 APPROVED 회사에 속하면 부여되고,
// 그 회사를 떠나도 라운지 활동은 유지된다(인테리어 생태계 자산화).

const LOUNGE_CATEGORIES = [
  { key: 'knowhow', label: '공정·시공 노하우', staffOnly: false, sortOrder: 10 },
  { key: 'usage', label: '수플렉스 사용 팁', staffOnly: false, sortOrder: 20 },
  { key: 'ruby', label: '스케치업 루비', staffOnly: false, sortOrder: 30 },
  { key: 'free', label: '자유잡담', staffOnly: false, sortOrder: 40 },
  { key: 'jobs', label: '구인구직', staffOnly: false, sortOrder: 50 },
  { key: 'notice', label: '공지', staffOnly: true, sortOrder: 60 },
];

const LOUNGE_CATEGORY_KEYS = LOUNGE_CATEGORIES.map((c) => c.key);

// 시드 태그 — 화이트리스트. label은 [] 포함하여 그대로 표시.
const LOUNGE_TAGS_SEED = [
  // role
  { key: 'role_designer', label: '[디자이너]', kind: 'role', sortOrder: 10 },
  { key: 'role_site', label: '[현장팀]', kind: 'role', sortOrder: 20 },
  { key: 'role_ops', label: '[운영]', kind: 'role', sortOrder: 30 },
  // 수플렉스 기능
  { key: 'topic_preset', label: '[프리셋추천]', kind: 'topic', sortOrder: 110 },
  { key: 'topic_quote', label: '[견적]', kind: 'topic', sortOrder: 120 },
  { key: 'topic_schedule', label: '[일정]', kind: 'topic', sortOrder: 130 },
  { key: 'topic_material', label: '[마감재]', kind: 'topic', sortOrder: 140 },
  { key: 'topic_settlement', label: '[지출정산]', kind: 'topic', sortOrder: 150 },
  { key: 'topic_advice', label: '[어드바이스]', kind: 'topic', sortOrder: 160 },
  // 시공 영역
  { key: 'topic_demolition', label: '[철거]', kind: 'topic', sortOrder: 210 },
  { key: 'topic_carpentry', label: '[목공]', kind: 'topic', sortOrder: 220 },
  { key: 'topic_electric', label: '[전기]', kind: 'topic', sortOrder: 230 },
  { key: 'topic_tile', label: '[타일]', kind: 'topic', sortOrder: 240 },
  { key: 'topic_painting', label: '[도장]', kind: 'topic', sortOrder: 250 },
  { key: 'topic_film', label: '[필름]', kind: 'topic', sortOrder: 260 },
  { key: 'topic_appliance', label: '[가전]', kind: 'topic', sortOrder: 270 },
  // 스케치업 루비
  { key: 'topic_ruby_share', label: '[루비공유]', kind: 'topic', sortOrder: 310 },
  { key: 'topic_ruby_request', label: '[루비개발요청]', kind: 'topic', sortOrder: 320 },
  { key: 'topic_ruby_question', label: '[루비질문]', kind: 'topic', sortOrder: 330 },
  { key: 'topic_tutorial', label: '[튜토리얼]', kind: 'topic', sortOrder: 340 },
  // 운영
  { key: 'topic_hiring', label: '[채용공고]', kind: 'topic', sortOrder: 410 },
  { key: 'topic_seeking', label: '[구직]', kind: 'topic', sortOrder: 420 },
  { key: 'topic_beta', label: '[베타피드백]', kind: 'topic', sortOrder: 430 },
  { key: 'topic_tax', label: '[세무]', kind: 'topic', sortOrder: 440 },
];

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

// 일괄 보강 — 모든 APPROVED 회사 멤버 중 라운지 멤버십 미보유자 부여.
// 어드민 endpoint와 boot 시 1회 호출 가능.
async function backfillLoungeMemberships(client) {
  const memberships = await client.membership.findMany({
    where: { company: { approvalStatus: 'APPROVED' } },
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
