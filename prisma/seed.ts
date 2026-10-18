import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  // Default password "rahasia123" for all test users
  const password = await bcrypt.hash('rahasia123', 10);

  // 1. Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@pasti.go.id' },
    update: {},
    create: {
      email: 'superadmin@pasti.go.id',
      password,
      name: 'Super Admin PASTI',
      role: Role.SUPER_ADMIN,
    },
  });

  // 2. Admin Pemerintah
  await prisma.user.upsert({
    where: { email: 'admin@pasti.go.id' },
    update: {},
    create: {
      email: 'admin@pasti.go.id',
      password,
      name: 'Admin Instansi',
      role: Role.ADMIN_PEMERINTAH,
    },
  });

  // 3. Vendor Swasta
  await prisma.user.upsert({
    where: { email: 'vendor@swasta.com' },
    update: {},
    create: {
      email: 'vendor@swasta.com',
      password,
      name: 'Vendor Aset',
      role: Role.VENDOR_SWASTA,
    },
  });

  // 4. Mock Data Tanah (PostGIS)
  const idTanah1 = 'LND-AT-01';
  const idTanah2 = 'LND-AT-02';

  // Check if Tanah exists
  const existingTanah = await prisma.tanah.findFirst({ where: { nibar: 'NIBAR-AT-001' }});
  
  if (!existingTanah) {
    console.log('Inserting Mock Tanah Data (Aceh Tengah)...');
    // Tanah 1: Kantor Bupati Aceh Tengah (Takengon) - Presisi
    await prisma.$executeRaw`
      INSERT INTO "tanah" (id, "kodeLokasi", "kodeBarang", nibar, "namaBarang", luas, "statusHak", "createdAt", "updatedAt", "koordinatPolygon")
      VALUES (
        ${idTanah1}, 'LOK-AT-01', 'BRG-AT-01', 'NIBAR-AT-001', 'Lahan Kantor Bupati Aceh Tengah', 15000.0, 'Hak Pakai', NOW(), NOW(),
        ST_GeomFromText('POLYGON((96.840742 4.630449, 96.841578 4.630267, 96.841267 4.629230, 96.840398 4.629433, 96.840742 4.630449))', 4326)
      )
    `;

    // Tanah 2: Area Wisata Pesisir Danau Laut Tawar - Bentuk Meliuk (Irregular)
    await prisma.$executeRaw`
      INSERT INTO "tanah" (id, "kodeLokasi", "kodeBarang", nibar, "namaBarang", luas, "statusHak", "createdAt", "updatedAt", "koordinatPolygon")
      VALUES (
        ${idTanah2}, 'LOK-AT-02', 'BRG-AT-02', 'NIBAR-AT-002', 'Aset Wisata Pesisir Laut Tawar', 45000.0, 'Hak Pengelolaan', NOW(), NOW(),
        ST_GeomFromText('POLYGON((96.8520 4.6240, 96.8525 4.6238, 96.8532 4.6234, 96.8535 4.6225, 96.8529 4.6215, 96.8518 4.6212, 96.8510 4.6218, 96.8505 4.6225, 96.8508 4.6235, 96.8515 4.6239, 96.8520 4.6240))', 4326)
      )
    `;

    // 5. Mock Data Risk Register (PostGIS)
    const idRisk1 = 'RSK-AT-001';
    
    await prisma.$executeRaw`
      INSERT INTO "risk_register" (id, "idTanah", "kategoriRisiko", "deskripsiRisiko", "skorDampak", "skorPeluang", "skorTotal", "tingkatRisiko", "createdAt", "updatedAt", "koordinatTitik")
      VALUES (
        ${idRisk1}, ${idTanah1}, 'Sosial/Batas', 'Sengketa batas pagar belakang dengan permukiman warga', 5, 4, 20, 'Extreme', NOW(), NOW(),
        ST_GeomFromText('POINT(96.84065 4.62935)', 4326)
      )
    `;

    // 6. Mock Data Action Plan
    await prisma.actionPlan.create({
      data: {
        idRisiko: idRisk1,
        rencanaMitigasi: 'Pengukuran ulang oleh BPN Aceh Tengah dan mediasi warga',
        pic: 'Dinas Pertanahan Aceh Tengah',
        targetSelesai: new Date('2026-11-10'),
        biayaEstimasi: 15000000,
        statusAksi: 'Open'
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
