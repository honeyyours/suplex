// 회사 전체 데이터 JSON 익스포트 — 회사 자산 9종 + 모든 프로젝트(모든 하위 모델).
// 다음 사이클(import 구현 예정)을 위해 모든 row의 id 를 보존.
// 사용자 FK(createdById 등) 는 null 로 마스킹하여 외부 회사에 import 시 OWNER 로 매핑 가능.
//
// 이번 사이클 범위: export 만 만들고 다운로드. import 는 다음 사이클(외래키 그래프 완성 후).
// 사용처: 봉기님이 표준 회사 데이터를 다운받아 외부 AI 에 양식 의뢰 / 회사 전체 백업·이전.

const { exportCompanyAssets } = require('./companyAssetExport');

const FORMAT_VERSION = 1;
const KIND = 'company-full';

// 익스포트 시 null 로 마스킹할 사용자 FK 필드. 외부 회사에 사용자 정보가 새어나가지 않게.
// import 사이클에서 임포트 실행 OWNER 의 id 로 일괄 매핑 예정.
const USER_FK_FIELDS = new Set([
  'createdById',
  'updatedById',
  'authorId',
  'uploaderId',
  'completedById',
  'changedById',
  'byUserId',
  'requestedById',
  'correctedById',
  'userId',
  'lastDeliveredById',
]);

// row(object) 또는 array 에서 사용자 FK 필드를 null 로 변환. 비-사용자 FK 는 보존.
function sanitizeUserRefs(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeUserRefs);
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    // Prisma Decimal 등 toJSON 갖는 객체는 그대로 둠
    if (typeof value.toJSON === 'function' && !Object.prototype.hasOwnProperty.call(value, 'constructor')) {
      return value;
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (USER_FK_FIELDS.has(k)) {
        out[k] = null;
      } else {
        out[k] = sanitizeUserRefs(v);
      }
    }
    return out;
  }
  return value;
}

async function exportFullCompany(prisma, companyId) {
  // 1) 회사 자산 9종은 기존 서비스 그대로
  const assets = await exportCompanyAssets(prisma, companyId);

  // 2) 회사 전체 프로젝트 + 모든 하위 모델 — Prisma include 로 통째로
  //    (admin 백업 라우트 admin.routes.js:523-541 구조와 동일 + 누락 모델 보강)
  const rawProjects = await prisma.project.findMany({
    where: { companyId },
    orderBy: { createdAt: 'asc' },
    include: {
      materials: true,
      schedules: { include: { tasks: true } },
      dailyScheduleEntries: { orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }] },
      checklists: true,
      dailyReports: true,
      expenses: true,
      quotes: { include: { lines: true } },
      simpleQuotes: { include: { lines: true } },
      projectMemos: { orderBy: { createdAt: 'asc' } },
      // PurchaseOrder 는 한 PO = 단일 항목(라인 관계 없음). include 추가 불필요.
      purchaseOrders: true,
      photos: true,
      measurements: true,
      materialRequests: true,
      scheduleChanges: { orderBy: { createdAt: 'desc' }, take: 1000 },
      phaseNotes: true,
      settlementNotes: true,
      members: true, // ProjectMember — userId 는 sanitize 에서 null
      // notifications 는 일회성·이전 의미 X → 제외
    },
  });

  const projects = sanitizeUserRefs(rawProjects);

  return {
    ...assets,
    formatVersion: FORMAT_VERSION,
    kind: KIND,
    projects,
    counts: {
      ...assets.counts,
      projects: projects.length,
      materials: projects.reduce((s, p) => s + (p.materials?.length || 0), 0),
      quotes: projects.reduce((s, p) => s + (p.quotes?.length || 0), 0),
      simpleQuotes: projects.reduce((s, p) => s + (p.simpleQuotes?.length || 0), 0),
      expenses: projects.reduce((s, p) => s + (p.expenses?.length || 0), 0),
      purchaseOrders: projects.reduce((s, p) => s + (p.purchaseOrders?.length || 0), 0),
      photos: projects.reduce((s, p) => s + (p.photos?.length || 0), 0),
      projectMemos: projects.reduce((s, p) => s + (p.projectMemos?.length || 0), 0),
      dailyScheduleEntries: projects.reduce((s, p) => s + (p.dailyScheduleEntries?.length || 0), 0),
      checklists: projects.reduce((s, p) => s + (p.checklists?.length || 0), 0),
      dailyReports: projects.reduce((s, p) => s + (p.dailyReports?.length || 0), 0),
    },
  };
}

module.exports = {
  exportFullCompany,
  FORMAT_VERSION,
  KIND,
  USER_FK_FIELDS,
};
