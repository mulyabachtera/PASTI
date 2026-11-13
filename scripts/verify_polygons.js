const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT id, "assetId", "namaBarang", "noSertifikat", luas, "statusLegalitas", ST_AsGeoJSON("koordinatPolygon") as geojson
    FROM tanah
    WHERE "koordinatPolygon" IS NOT NULL
    ORDER BY "namaBarang" ASC
  `;

  console.log(`\n=== VERIFIKASI POLIGON AKTIF DI LOCALHOST ===`);
  console.log(`Total Aset dengan Poligon Aktif: ${rows.length}\n`);

  rows.forEach((r, i) => {
    const geo = JSON.parse(r.geojson);
    const pts = geo.coordinates[0].length;
    console.log(`${i + 1}. [${r.statusLegalitas}] ${r.namaBarang}`);
    console.log(`   Sertifikat : ${r.noSertifikat || '-'}`);
    console.log(`   Luas Bidang: ${Number(r.luas || 0).toLocaleString('id-ID')} m²`);
    console.log(`   Titik Batas: ${pts} titik`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

