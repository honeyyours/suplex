const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_schema, table_name FROM information_schema.tables
      WHERE table_name LIKE '%migration%' OR table_name LIKE '%prisma%'
    `);
    console.log('matching tables:', tables);
    const allTables = await prisma.$queryRawUnsafe(`
      SELECT current_database() as db, current_schema() as schema
    `);
    console.log('connection:', allTables);
    const rows = [];
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
