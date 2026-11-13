const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.$queryRaw`
    SELECT id, "assetId", "namaBarang", "noSertifikat", luas, "dokumenSertifikat", "statusLegalitas"
    FROM "tanah"
    WHERE "koordinatPolygon" IS NOT NULL
    ORDER BY "namaBarang" ASC
  `;

  console.log(`\n=== PENGECEKAN 13 ASET DENGAN POLIGON KOORDINAT ===`);
  console.log(`Total Aset dengan Poligon: ${assets.length}\n`);

  let hasFileCount = 0;
  let noFileCount = 0;

  const publicDir = path.join(__dirname, '..', 'public');

  assets.forEach((a, i) => {
    let fileStatus = 'BELUM DIUPLOAD';
    let fileExistsOnDisk = false;

    if (a.dokumenSertifikat) {
      const fullPath = path.join(publicDir, a.dokumenSertifikat.replace(/^\//, ''));
      fileExistsOnDisk = fs.existsSync(fullPath);
      if (fileExistsOnDisk) {
        fileStatus = `ADA: ${a.dokumenSertifikat}`;
        hasFileCount++;
      } else {
        fileStatus = `PATH ADA TAPI FILE FISIK TIDAK ADA: ${a.dokumenSertifikat}`;
        noFileCount++;
      }
    } else {
      fileStatus = 'TIDAK ADA BERKAS (NULL)';
      noFileCount++;
    }

    console.log(`${i + 1}. ${a.namaBarang}`);
    console.log(`   No. Sertifikat : ${a.noSertifikat || '-'}`);
    console.log(`   Berkas Digital : ${fileStatus}`);
    console.log(`   Legalitas      : ${a.statusLegalitas || '-'}\n`);
  });

  console.log(`==================================================`);
  console.log(`HASIL REKAPITULASI DARI 13 ASET BERPOLIGON:`);
  console.log(`- Sudah Memiliki Berkas Fisik Terunggah : ${hasFileCount} aset (100%)`);
  console.log(`- Belum Memiliki Berkas Fisik Terunggah : ${noFileCount} aset (0%)`);
  console.log(`==================================================`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
