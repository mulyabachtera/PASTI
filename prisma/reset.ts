import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRaw`TRUNCATE TABLE tanah CASCADE`;
  console.log('Truncated');
}
main().finally(()=>prisma.$disconnect());
