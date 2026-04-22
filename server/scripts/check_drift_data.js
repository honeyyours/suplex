const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const [issuesTotal, reportPhotosTotal] = await Promise.all([
      prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS c FROM "issues"'),
      prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS c FROM "report_photos"').catch(() => [{ c: 'TABLE_MISSING' }]),
    ]);
    const photoColCheck = await prisma.$queryRawUnsafe(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='issues' AND column_name IN ('photoUrl','type','urgency')
    `);
    let issuesWithPhoto = null;
    if (photoColCheck.some((r) => r.column_name === 'photoUrl')) {
      const [row] = await prisma.$queryRawUnsafe(
        'SELECT COUNT(*)::int AS c FROM "issues" WHERE "photoUrl" IS NOT NULL'
      );
      issuesWithPhoto = row.c;
    }
    let issueTypeValues = null;
    if (photoColCheck.some((r) => r.column_name === 'type')) {
      issueTypeValues = await prisma.$queryRawUnsafe(
        'SELECT DISTINCT "type" FROM "issues" LIMIT 20'
      );
    }
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public'
      ORDER BY table_name
    `);
    console.log(JSON.stringify({
      issues_total: issuesTotal[0].c,
      report_photos_total: reportPhotosTotal[0].c,
      issues_columns: photoColCheck.map((r) => r.column_name),
      issues_with_photoUrl: issuesWithPhoto,
      issue_distinct_types: issueTypeValues,
      tables: tables.map((t) => t.table_name),
    }, null, 2));
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
