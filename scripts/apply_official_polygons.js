/**
 * Script untuk Menerapkan Koordinat Poligon Asli dari Database Koordinat.xlsx
 * ke Database PostgreSQL SIM PASTI.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(__dirname, 'mapped_17_polygons.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File ${jsonPath} tidak ditemukan!`);
  }

  const polygons = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Memuat ${polygons.length} poligon dari ${jsonPath}...`);

  let appliedCount = 0;
  let skippedCount = 0;

  for (const poly of polygons) {
    const geojsonStr = JSON.stringify(poly.geojson);
    const assetName = poly.matched_master_asset;
    const certNo = poly.no_surat;

    let targetAsset = null;

    // Cari aset di database
    if (assetName) {
      targetAsset = await prisma.tanah.findFirst({
        where: {
          namaBarang: assetName
        }
      });
    }

    // Jika belum ketemu, coba cari berdasarkan nomor sertifikat
    if (!targetAsset && certNo && certNo !== '-' && certNo !== 'None' && certNo.length > 5) {
      targetAsset = await prisma.tanah.findFirst({
        where: {
          noSertifikat: { contains: certNo }
        }
      });
    }

    if (!targetAsset) {
      console.warn(`[LEWATI] Poligon #${poly.polygon_index} (${poly.pengguna || 'Tanpa Label'}): Target aset tidak ditemukan di DB.`);
      skippedCount++;
      continue;
    }

    // Terapkan poligon spasial ke PostGIS
    try {
      await prisma.$executeRaw`
        UPDATE "tanah"
        SET "koordinatPolygon" = ST_SetSRID(ST_GeomFromGeoJSON(${geojsonStr}), 4326),
            "updatedAt" = NOW()
        WHERE id = ${targetAsset.id}
      `;

      console.log(`[BERHASIL] Poligon #${poly.polygon_index} -> ${targetAsset.namaBarang} (Luas Hitung: ${poly.luas_calculated_m2.toLocaleString('id-ID')} m², ${poly.points_count} titik)`);
      appliedCount++;
    } catch (err) {
      console.error(`[ERROR] Gagal menerapkan poligon untuk ${targetAsset.namaBarang}:`, err);
    }
  }

  console.log(`\n=== SELESAI MENERAPKAN POLIGON SPASIAL ===`);
  console.log(`Total Poligon Berhasil Diterapkan: ${appliedCount}`);
  console.log(`Poligon Belum Tertaut: ${skippedCount}`);

  // Hitung total aset yang kini memiliki koordinatPolygon di DB
  const countWithPolygon = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM "tanah" WHERE "koordinatPolygon" IS NOT NULL
  `;
  console.log(`Total Aset dengan Poligon Aktif di Database: ${countWithPolygon[0].count} aset.`);
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

