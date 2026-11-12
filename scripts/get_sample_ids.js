const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const t1 = await prisma.tanah.findFirst({ where: { namaBarang: { contains: 'terminal lama' } } });
  const t2 = await prisma.tanah.findFirst({ where: { namaBarang: { contains: 'Lukup Penalam' } } });
  console.log('Terminal Lama ID:', t1?.id, t1?.dokumenSertifikat);
  console.log('Lukup Penalam ID:', t2?.id, t2?.dokumenSertifikat);
}

main().finally(() => prisma.$disconnect());

