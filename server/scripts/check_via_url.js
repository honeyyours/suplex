const { PrismaClient } = require('@prisma/client');

(async () => {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node check_via_url.js <DATABASE_URL>');
    process.exit(1);
  }
  const prisma = new PrismaClient({ datasourceUrl: url });
  try {
    const conn = await prisma.$queryRawUnsafe(
      `SELECT current_database() as db, current_schema() as schema, inet_server_addr()::text as addr`
    );
    const tables = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as c FROM information_schema.tables WHERE table_schema='public'
    `);
    const prismaTbl = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema='public' AND table_name='_prisma_migrations'
      ) as exists
    `);
    const counts = {};
    for (const t of ['expenses', 'projects', 'companies', 'users', 'memberships', 'account_codes', 'expense_category_rules', 'materials', 'daily_schedule_entries']) {
      try {
        const [row] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM "${t}"`);
        counts[t] = row.c;
      } catch (e) { counts[t] = 'ERR'; }
    }
    console.log({
      conn,
      tableCount: tables[0].c,
      prismaMigrations: prismaTbl[0].exists,
      counts,
    });
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
