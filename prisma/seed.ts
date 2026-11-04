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
    update: {
      nip: '199010252022031003',
      name: 'Mulya Bachtera, S. Inf',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      nip: '199010252022031003',
      email: 'superadmin@pasti.go.id',
      password,
      name: 'Mulya Bachtera, S. Inf',
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // 2. Admin Pemerintah
  await prisma.user.upsert({
    where: { email: 'admin@pasti.go.id' },
    update: {
      nip: '197712141997031001',
      name: 'Gunawan Putra, SE, M.Si',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      nip: '197712141997031001',
      email: 'admin@pasti.go.id',
      password,
      name: 'Gunawan Putra, SE, M.Si',
      role: Role.ADMIN_PEMERINTAH,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // 3. Vendor Swasta
  await prisma.user.upsert({
    where: { email: 'vendor@swasta.com' },
    update: {
      nip: '199512312020011005',
      name: 'Vendor Aset',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      nip: '199512312020011005',
      email: 'vendor@swasta.com',
      password,
      name: 'Vendor Aset',
      role: Role.VENDOR_SWASTA,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // 4. Verifikator
  await prisma.user.upsert({
    where: { email: 'verifikator@pasti.go.id' },
    update: {
      nip: '198306012010031003',
      name: 'Erwin Pinosa, ST',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      nip: '198306012010031003',
      email: 'verifikator@pasti.go.id',
      password,
      name: 'Erwin Pinosa, ST',
      role: Role.VERIFICATOR,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // 5. Operator
  await prisma.user.upsert({
    where: { email: 'operator@pasti.go.id' },
    update: {
      nip: '198909192019031006',
      name: 'Ahmaddi M, A. Md',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      nip: '198909192019031006',
      email: 'operator@pasti.go.id',
      password,
      name: 'Ahmaddi M, A. Md',
      role: Role.OPERATOR,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
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
