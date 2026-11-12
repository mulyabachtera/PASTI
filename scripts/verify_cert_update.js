const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const withCert = await prisma.tanah.findMany({
    where: {
      dokumenSertifikat: { not: null }
    },
    select: {
      id: true,
      assetId: true,
      namaBarang: true,
      noSertifikat: true,
      luas: true,
      statusLegalitas: true,
      dokumenSertifikat: true,
      totalSkorRisiko: true,
      kategoriRisiko: true
    }
  });

  console.log(`Total aset dengan dokumen sertifikat: ${withCert.length}`);
  console.log(withCert.map((a, i) => `${i+1}. [${a.assetId}] ${a.namaBarang} | No: ${a.noSertifikat} | Luas: ${a.luas} m² | Doc: ${a.dokumenSertifikat}`).join('\n'));
}

main().finally(() => prisma.$disconnect());

