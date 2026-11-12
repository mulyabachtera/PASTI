const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.tanah.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      assetId: true,
      nibar: true,
      kodeTanah: true,
      namaBarang: true,
      noSertifikat: true,
      luas: true,
      statusHak: true,
      statusLegalitas: true,
      dokumenSertifikat: true,
      alamatLokasi: true,
      kecamatan: true
    }
  });

  console.log(`Found ${assets.length} assets.`);
  fs.writeFileSync(path.join(__dirname, 'current_assets.json'), JSON.stringify(assets, null, 2), 'utf8');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

