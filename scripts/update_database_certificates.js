/**
 * Script Sinkronisasi Dokumen Sertifikat Fisik ke Master Data Tanah SIM PASTI
 * - Menautkan dokumenSertifikat (/uploads/certificates/sertifikat_xx_xxx.pdf)
 * - Mengisi No Sertifikat resmi jika sebelumnya kosong
 * - Mengisi Luas definitif BPN jika sebelumnya kosong (contoh: Terminal Lama 5.902 m², Lukup Penalam/Dermaga Dedalu 7.991 m²)
 * - Memperbarui statusHak menjadi 'Hak Pakai'
 * - Memperbarui statusLegalitas menjadi 'Sertifikat'
 * - Menghitung ulang risiko komposit (skor legalitas turun dari bobot 5 ke 1)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function calculateRisk(input) {
  const pAset = Number(input.papanAset) || 0;
  const bBidang = Number(input.batasBidang) || 0;
  const pPagar = Number(input.pagarPengamanan) || 0;
  const sPenguasaan = Number(input.statusPenguasaan) || 0;
  const pManfaat = Number(input.pemanfaatan) || 0;

  let legalWeight = 0;
  const leg = (input.statusLegalitas || '').toLowerCase();
  if (leg.includes('proses') || leg.includes('bpn')) {
    legalWeight = 1;
  } else if (leg.includes('belum') || leg.includes('tidak') || leg.includes('sengketa') || leg.includes('klaim')) {
    legalWeight = 2;
  } else if (leg.includes('sertifikat') || leg.includes('asli')) {
    legalWeight = 0;
  } else {
    legalWeight = 1;
  }

  const skorAdministrasi = Math.min(5, Math.max(1, 1 + pAset + legalWeight));
  const skorLegal = Math.min(5, Math.max(1, 1 + (legalWeight * 2)));
  const skorFisik = Math.min(5, Math.max(1, 1 + bBidang + pPagar));
  const skorPenguasaan = Math.min(5, Math.max(1, 1 + sPenguasaan + pManfaat));
  const skorSengketa = Math.min(5, Math.max(1, 1 + sPenguasaan + bBidang));
  const isHighValue = (input.nilaiPerolehan || 0) >= 1000000000 ? 1 : 0;
  const skorStrategis = Math.min(5, Math.max(1, 1 + pManfaat + isHighValue));

  const totalSkor = skorAdministrasi + skorLegal + skorFisik + skorPenguasaan + skorSengketa + skorStrategis;

  let kategoriRisiko = 'Rendah';
  let prioritasTindakan = 'Monitoring';

  if (totalSkor >= 21) {
    kategoriRisiko = 'Sangat Tinggi';
    prioritasTindakan = 'Prioritas Utama';
  } else if (totalSkor >= 16) {
    kategoriRisiko = 'Tinggi';
    prioritasTindakan = 'Prioritas 1';
  } else if (totalSkor >= 11) {
    kategoriRisiko = 'Sedang';
    prioritasTindakan = 'Monitoring';
  } else {
    kategoriRisiko = 'Rendah';
    prioritasTindakan = 'Monitoring';
  }

  return {
    skorAdministrasi,
    skorLegal,
    skorFisik,
    skorPenguasaan,
    skorSengketa,
    skorStrategis,
    totalSkor,
    kategoriRisiko,
    prioritasTindakan
  };
}

async function main() {
  const planPath = path.join(__dirname, 'certificate_sync_plan.json');
  if (!fs.existsSync(planPath)) {
    throw new Error(`File rencana sinkronisasi ${planPath} belum siap!`);
  }

  const plans = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  console.log(`Memulai sinkronisasi ${plans.length} dokumen sertifikat ke database...`);

  let updatedCount = 0;

  for (const item of plans) {
    // Cari aset di database berdasarkan filter
    let asset = null;
    const filter = item.asset_filter;

    if (filter.kode && filter.name_contains) {
      asset = await prisma.tanah.findFirst({
        where: {
          kodeTanah: filter.kode,
          namaBarang: { contains: filter.name_contains }
        }
      });
    } else if (filter.name_contains && filter.luas) {
      asset = await prisma.tanah.findFirst({
        where: {
          namaBarang: { contains: filter.name_contains },
          luas: filter.luas
        }
      });
    } else if (filter.name_contains) {
      asset = await prisma.tanah.findFirst({
        where: {
          namaBarang: { contains: filter.name_contains }
        }
      });
    }

    if (!asset) {
      console.warn(`[SKIP] Aset tidak ditemukan untuk filter:`, filter);
      continue;
    }

    // Hitung ulang risiko dengan statusLegalitas = 'Sertifikat'
    const newLuas = item.luas || asset.luas;
    const newNoSertifikat = item.no_sertifikat || asset.noSertifikat;
    const newStatusHak = item.status_hak || asset.statusHak;
    const newStatusLegalitas = 'Sertifikat';

    const risk = calculateRisk({
      papanAset: asset.papanAset ?? 0,
      batasBidang: asset.batasBidang ?? 0,
      pagarPengamanan: asset.pagarPengamanan ?? 0,
      statusPenguasaan: asset.statusPenguasaan ?? 0,
      pemanfaatan: asset.pemanfaatan ?? 0,
      statusLegalitas: newStatusLegalitas,
      nilaiPerolehan: asset.nilaiPerolehan
    });

    const isBpk = (asset.id === 'e3db500d-49e1-46e4-83d6-da9a8d4de68f' || (asset.namaBarang && asset.namaBarang.includes('BPKK')));

    await prisma.tanah.update({
      where: { id: asset.id },
      data: {
        dokumenSertifikat: item.relative_url,
        noSertifikat: newNoSertifikat,
        luas: newLuas,
        statusHak: newStatusHak,
        statusLegalitas: newStatusLegalitas,
        skorAdministrasi: risk.skorAdministrasi,
        skorLegal: risk.skorLegal,
        skorFisik: risk.skorFisik,
        skorPenguasaan: risk.skorPenguasaan,
        skorSengketa: risk.skorSengketa,
        skorStrategis: risk.skorStrategis,
        totalSkorRisiko: risk.totalSkor,
        kategoriRisiko: risk.kategoriRisiko,
        prioritasTindakan: risk.prioritasTindakan,
        // Pertahankan verifikator BPKK jika BPKK
        verifiedBy: isBpk ? 'Mulya Bachtera, S. Inf' : (asset.verifiedBy || 'Erwin Pinosa, ST'),
        inputBy: isBpk ? asset.inputBy : (asset.inputBy || 'Ahmaddi M, A. Md')
      }
    });

    console.log(`[UPDATED] ${asset.namaBarang} -> Sertifikat: ${newNoSertifikat}, Luas: ${newLuas} m², Dokumen: ${item.relative_url}, Risiko: ${risk.kategoriRisiko} (${risk.totalSkor}/30)`);
    updatedCount++;

    // Jika ada secondary_filter (contoh Terminal Perhubungan dan BLUD Datu Beru 25.770)
    if (item.secondary_filter) {
      const secFilter = item.secondary_filter;
      let secAsset = null;
      if (secFilter.name_contains && secFilter.luas) {
        secAsset = await prisma.tanah.findFirst({
          where: {
            namaBarang: { contains: secFilter.name_contains },
            luas: secFilter.luas
          }
        });
      } else if (secFilter.name_contains) {
        secAsset = await prisma.tanah.findFirst({
          where: {
            namaBarang: { contains: secFilter.name_contains }
          }
        });
      }

      if (secAsset && secAsset.id !== asset.id) {
        const secRisk = calculateRisk({
          papanAset: secAsset.papanAset ?? 0,
          batasBidang: secAsset.batasBidang ?? 0,
          pagarPengamanan: secAsset.pagarPengamanan ?? 0,
          statusPenguasaan: secAsset.statusPenguasaan ?? 0,
          pemanfaatan: secAsset.pemanfaatan ?? 0,
          statusLegalitas: newStatusLegalitas,
          nilaiPerolehan: secAsset.nilaiPerolehan
        });

        await prisma.tanah.update({
          where: { id: secAsset.id },
          data: {
            dokumenSertifikat: item.relative_url,
            noSertifikat: secAsset.noSertifikat || newNoSertifikat,
            statusHak: newStatusHak,
            statusLegalitas: newStatusLegalitas,
            skorAdministrasi: secRisk.skorAdministrasi,
            skorLegal: secRisk.skorLegal,
            skorFisik: secRisk.skorFisik,
            skorPenguasaan: secRisk.skorPenguasaan,
            skorSengketa: secRisk.skorSengketa,
            skorStrategis: secRisk.skorStrategis,
            totalSkorRisiko: secRisk.totalSkor,
            kategoriRisiko: secRisk.kategoriRisiko,
            prioritasTindakan: secRisk.prioritasTindakan
          }
        });
        console.log(`[SECONDARY UPDATED] ${secAsset.namaBarang} -> Dokumen: ${item.relative_url}`);
        updatedCount++;
      }
    }
  }

  console.log(`Selesai! Berhasil memperbarui ${updatedCount} entitas aset tanah dengan sertifikat fisik.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

