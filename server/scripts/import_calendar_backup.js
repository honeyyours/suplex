// 일회성 스크립트 — 옛 웹달력 백업 JSON을 스플렉스로 임포트
// 실행: node scripts/import_calendar_backup.js [백업파일경로]

const path = require('path');
const fs = require('fs');
const prisma = require('../src/config/prisma');

const CATEGORY_MAP = {
  '일반': 'GENERAL',
  '잔손': 'TOUCH_UP',
  '긴급': 'URGENT',
  '고객요청': 'CLIENT_REQUEST',
  '디자인→현장': 'DESIGN_TO_FIELD',
};

async function main() {
  const backupPath = process.argv[2] || path.resolve(__dirname, '../../backup_import.json');
  if (!fs.existsSync(backupPath)) {
    console.error(`백업 파일 없음: ${backupPath}`);
    process.exit(1);
  }
  console.log(`▸ 백업 파일: ${backupPath}`);

  const raw = fs.readFileSync(backupPath, 'utf-8');
  const data = JSON.parse(raw);

  if (!data.projects || !Array.isArray(data.projects)) {
    console.error('▸ projects 배열이 없습니다');
    process.exit(1);
  }

  // OWNER 사용자 찾기 (회사 기준)
  const owner = await prisma.membership.findFirst({
    where: { role: 'OWNER' },
    include: { user: true, company: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!owner) {
    console.error('▸ OWNER 권한 사용자를 찾을 수 없습니다');
    process.exit(1);
  }
  const companyId = owner.companyId;
  const userId = owner.userId;
  console.log(`▸ 임포트 대상: 회사 "${owner.company.name}" (사용자 ${owner.user.name})`);

  const idMap = new Map();

  // ============ 1) 프로젝트 ============
  console.log('\n[1/3] 프로젝트 생성...');
  for (const p of data.projects) {
    const created = await prisma.project.create({
      data: {
        companyId,
        createdById: userId,
        name: p.name,
        customerName: '(미입력)',
        siteAddress: (p.address && p.address.trim()) || '(미지정)',
        startDate: p.start ? new Date(p.start) : null,
        expectedEndDate: p.end ? new Date(p.end) : null,
        status: p.hidden ? 'COMPLETED' : 'IN_PROGRESS',
        doorPassword: p.doorPassword || null,
        siteNotes: p.siteNotes || null,
        memo: '웹달력 데이터에서 임포트됨',
      },
    });
    idMap.set(p.id, created.id);
    console.log(`  ✓ ${p.name} ${p.hidden ? '(완료)' : '(진행중)'} → ${created.id}`);
  }

  // ============ 2) 일정 (DailyScheduleEntry) ============
  console.log('\n[2/3] 일정 임포트...');
  const scheduleRows = [];
  for (const [key, content] of Object.entries(data.schedules || {})) {
    const m = key.match(/^(\d+)_(\d{4}-\d{2}-\d{2})$/);
    if (!m) {
      console.warn(`  ⚠ 잘못된 키 형식: ${key}`);
      continue;
    }
    const oldId = m[1];
    const date = m[2];
    const newId = idMap.get(oldId);
    if (!newId) {
      console.warn(`  ⚠ 알수없는 프로젝트 ID ${oldId} (key=${key})`);
      continue;
    }
    const confirmed = !!data.confirmedSchedules?.[key];
    scheduleRows.push({
      projectId: newId,
      date: new Date(date),
      content: String(content),
      confirmed,
      confirmedAt: confirmed ? new Date() : null,
      createdById: userId,
      updatedById: userId,
    });
  }
  await prisma.dailyScheduleEntry.createMany({ data: scheduleRows });
  console.log(`  ✓ ${scheduleRows.length}개 일정 (확정 ${scheduleRows.filter((r) => r.confirmed).length}개)`);

  // ============ 3) 체크리스트 ============
  console.log('\n[3/3] 체크리스트 임포트...');
  const checklistRows = [];
  for (const [oldId, group] of Object.entries(data.checkLists || {})) {
    const newId = idMap.get(oldId);
    if (!newId) continue;
    for (const item of group.items || []) {
      checklistRows.push({
        projectId: newId,
        title: item.content || '(내용없음)',
        category: CATEGORY_MAP[item.category] || 'GENERAL',
        isDone: !!item.completed,
        completedAt: item.completedAt ? new Date(item.completedAt) : null,
        completedById: item.completed ? userId : null,
        createdById: userId,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      });
    }
  }
  await prisma.projectChecklist.createMany({ data: checklistRows });
  const doneCount = checklistRows.filter((r) => r.isDone).length;
  console.log(`  ✓ ${checklistRows.length}개 체크리스트 (완료 ${doneCount} / 미완 ${checklistRows.length - doneCount})`);

  console.log('\n✅ 임포트 완료');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ 에러:', e);
  process.exit(1);
});
