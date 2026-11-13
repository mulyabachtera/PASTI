/**
 * Script Sinkronisasi Master Data 40 Aset & 24 Dokumen Sertifikat ke Database
 * Dapat dijalankan di localhost maupun VPS (Biznet GIO).
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

function getScriptsDir() {
  const localDir = __dirname;
  if (fs.existsSync(path.join(localDir, 'extracted_40_assets.json'))) {
    return localDir;
  }
  const cwdDir = path.join(process.cwd(), 'scripts');
  if (fs.existsSync(path.join(cwdDir, 'extracted_40_assets.json'))) {
    return cwdDir;
  }
  const cwdWebDir = path.join(process.cwd(), 'sim-pasti-web', 'scripts');
  if (fs.existsSync(path.join(cwdWebDir, 'extracted_40_assets.json'))) {
    return cwdWebDir;
  }
  return localDir;
}

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

async function syncAll() {
  const scriptsDir = getScriptsDir();
  console.log(`[Sync] Menggunakan direktori scripts: ${scriptsDir}`);

  console.log('=== [1/2] MENYINKRONKAN 40 MASTER ASET STRATEGIS ===');
  const json40Path = path.join(scriptsDir, 'extracted_40_assets.json');
  if (!fs.existsSync(json40Path)) {
    throw new Error(`File ${json40Path} tidak ditemukan!`);
  }

  const items = JSON.parse(fs.readFileSync(json40Path, 'utf8'));
  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const rowNum = it.row;

    const rawIdTanah = it.id_tanah ? String(it.id_tanah).trim() : null;
    const assetId = rawIdTanah || '-';
    const nibar = rawIdTanah || `BELUM-ADA-${String(rowNum).padStart(2, '0')}`;
    const kodeTanah = it.kode_aset && it.kode_aset !== '......' ? String(it.kode_aset).trim() : null;
    const namaBarang = it.nama_combined ? String(it.nama_combined).trim() : 'Aset Tanah Pemda';
    const pengelola = it.pengelola ? String(it.pengelola).trim() : null;
    const luas = it.luas ? parseFloat(String(it.luas).replace(/,/g, '')) : null;
    const noSertifikat = it.no_sertifikat ? String(it.no_sertifikat).trim() : null;
    const nilaiPerolehan = it.nilai_perolehan ? parseFloat(String(it.nilai_perolehan).replace(/,/g, '')) : null;
    const asalPerolehan = it.cara_perolehan ? String(it.cara_perolehan).trim() : null;
    const alamatLokasi = it.alamat ? String(it.alamat).trim() : null;
    const kecamatan = it.kecamatan ? String(it.kecamatan).trim() : null;
    const kabKota = it.kab_kota ? String(it.kab_kota).trim() : 'Aceh Tengah';
    const provinsi = it.provinsi ? String(it.provinsi).trim() : 'Aceh';

    let statusHak = it.status_hak ? String(it.status_hak).trim() : 'Hak Milik';
    if (it.status_legalitas === 'Hak Pakai' || (it.nama_barang && it.nama_barang.includes('Hak Pakai'))) {
      statusHak = 'Hak Pakai';
    }

    let statusLegalitas = 'Belum Bersertifikat';
    if (it.status_legalitas && it.status_legalitas.trim().length > 0) {
      statusLegalitas = it.status_legalitas.trim();
    } else if (noSertifikat && noSertifikat !== '-' && noSertifikat !== '0') {
      statusLegalitas = 'Sertifikat';
    }

    // Cari aset eksisting berdasarkan assetId, nibar, atau namaBarang
    let existing = null;
    if (rawIdTanah) {
      existing = await prisma.tanah.findFirst({
        where: {
          OR: [
            { assetId: rawIdTanah },
            { nibar: rawIdTanah }
          ]
        }
      });
    } else {
      existing = await prisma.tanah.findFirst({
        where: {
          OR: [
            { nibar },
            { namaBarang }
          ]
        }
      });
    }

    const isTerminalLama = (existing && existing.namaBarang && existing.namaBarang.includes('terminal lama bale atu')) || (namaBarang && namaBarang.includes('terminal lama bale atu'));

    const physicalInput = {
      papanAset: isTerminalLama ? 1 : 0,
      batasBidang: isTerminalLama ? 1 : 0,
      pagarPengamanan: isTerminalLama ? 2 : 0,
      statusPenguasaan: isTerminalLama ? 1 : 0,
      pemanfaatan: isTerminalLama ? 2 : 0,
      statusLegalitas: isTerminalLama ? 'Belum Bersertifikat' : statusLegalitas,
      nilaiPerolehan
    };
    const risk = calculateRisk(physicalInput);

    if (existing) {
      await prisma.tanah.update({
        where: { id: existing.id },
        data: {
          assetId,
          kodeTanah,
          kodeBarang: kodeTanah,
          namaBarang,
          pengelola: isTerminalLama ? 'Dinas Perdagangan' : pengelola,
          luas: isTerminalLama ? 5632.04 : (existing.luas || luas),
          statusHak: isTerminalLama ? 'Tanah Pemda' : (existing.statusHak || statusHak),
          noSertifikat: isTerminalLama ? null : (existing.noSertifikat || noSertifikat),
          dokumenSertifikat: isTerminalLama ? null : existing.dokumenSertifikat,
          permasalahan: isTerminalLama ? 'Belum bersertifikat (Eks terminal lama dimanfaatkan sebagai pasar petani/pedagang lokal)' : existing.permasalahan,
          nilaiPerolehan,
          asalPerolehan,
          alamatLokasi: isTerminalLama ? 'Jl. Bale Atu, Kp. Bale Atu, Kec. Lut Tawar' : alamatLokasi,
          kecamatan: isTerminalLama ? 'Lut Tawar' : kecamatan,
          kabKota,
          provinsi,
          statusLegalitas: isTerminalLama ? 'Belum Bersertifikat' : (existing.statusLegalitas || statusLegalitas),
          papanAset: physicalInput.papanAset,
          batasBidang: physicalInput.batasBidang,
          pagarPengamanan: physicalInput.pagarPengamanan,
          statusPenguasaan: physicalInput.statusPenguasaan,
          pemanfaatan: physicalInput.pemanfaatan,
          skorAdministrasi: risk.skorAdministrasi,
          skorLegal: risk.skorLegal,
          skorFisik: risk.skorFisik,
          skorPenguasaan: risk.skorPenguasaan,
          skorSengketa: risk.skorSengketa,
          skorStrategis: risk.skorStrategis,
          totalSkorRisiko: risk.totalSkor,
          kategoriRisiko: risk.kategoriRisiko,
          prioritasTindakan: risk.prioritasTindakan,
          statusVerifikasi: 'TERVERIFIKASI',
          inputBy: 'Ahmaddi M, A. Md',
          verifiedBy: 'Erwin Pinosa, ST',
          verifiedAt: new Date()
        }
      });
      updatedCount++;
    } else {
      await prisma.tanah.create({
        data: {
          id: crypto.randomUUID(),
          assetId,
          nibar,
          kodeTanah,
          kodeBarang: kodeTanah,
          namaBarang,
          pengelola,
          luas,
          statusHak,
          noSertifikat,
          nilaiPerolehan,
          asalPerolehan,
          alamatLokasi,
          kecamatan,
          kabKota,
          provinsi,
          statusLegalitas,
          dokumenSertifikat: null,
          fotoAset: null,
          papanAset: 0,
          batasBidang: 0,
          pagarPengamanan: 0,
          statusPenguasaan: 0,
          pemanfaatan: 0,
          permasalahan: null,
          skorAdministrasi: risk.skorAdministrasi,
          skorLegal: risk.skorLegal,
          skorFisik: risk.skorFisik,
          skorPenguasaan: risk.skorPenguasaan,
          skorSengketa: risk.skorSengketa,
          skorStrategis: risk.skorStrategis,
          totalSkorRisiko: risk.totalSkor,
          kategoriRisiko: risk.kategoriRisiko,
          prioritasTindakan: risk.prioritasTindakan,
          statusVerifikasi: 'TERVERIFIKASI',
          inputBy: 'Ahmaddi M, A. Md',
          verifiedBy: 'Erwin Pinosa, ST',
          verifiedAt: new Date()
        }
      });
      createdCount++;
    }
  }
  console.log(`[Master Aset] Selesai: ${createdCount} baru dibuat, ${updatedCount} diperbarui.`);

  console.log('\n=== [2/2] MENYINKRONKAN 24 DOKUMEN SERTIFIKAT KE ASET ===');
  const planPath = path.join(scriptsDir, 'certificate_sync_plan.json');
  if (!fs.existsSync(planPath)) {
    throw new Error(`File ${planPath} tidak ditemukan!`);
  }

  const plans = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  let certUpdatedCount = 0;

  for (const item of plans) {
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

    if (asset.namaBarang && asset.namaBarang.includes('terminal lama bale atu')) {
      console.warn(`[SKIP] Aset ${asset.namaBarang} berstatus Tanpa Sertifikat, lewati penautan sertifikat.`);
      continue;
    }

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
        verifiedBy: isBpk ? 'Mulya Bachtera, S. Inf' : (asset.verifiedBy || 'Erwin Pinosa, ST'),
        inputBy: isBpk ? asset.inputBy : (asset.inputBy || 'Ahmaddi M, A. Md')
      }
    });

    certUpdatedCount++;

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

      if (secAsset) {
        await prisma.tanah.update({
          where: { id: secAsset.id },
          data: {
            dokumenSertifikat: item.relative_url,
            noSertifikat: newNoSertifikat,
            statusHak: newStatusHak,
            statusLegalitas: newStatusLegalitas
          }
        });
        certUpdatedCount++;
      }
    }
  }

  console.log(`[Sertifikat] Selesai: ${certUpdatedCount} aset telah ditautkan dengan dokumen sertifikat fisik.`);

  console.log('\n=== [3/3] MENERAPKAN POLIGON SPASIAL HASIL UKUR KE DATABASE ===');
  const polyPath = path.join(scriptsDir, 'mapped_17_polygons.json');
  let polygonAppliedCount = 0;
  if (fs.existsSync(polyPath)) {
    const polygons = JSON.parse(fs.readFileSync(polyPath, 'utf8'));
    for (const poly of polygons) {
      const geojsonStr = JSON.stringify(poly.geojson);
      const assetName = poly.matched_master_asset;
      const certNo = poly.no_surat;

      let targetAsset = null;
      if (assetName) {
        targetAsset = await prisma.tanah.findFirst({
          where: { namaBarang: assetName }
        });
      }
      if (!targetAsset && certNo && certNo !== '-' && certNo !== 'None' && certNo.length > 5) {
        targetAsset = await prisma.tanah.findFirst({
          where: { noSertifikat: { contains: certNo } }
        });
      }

      if (targetAsset) {
        try {
          await prisma.$executeRaw`
            UPDATE "tanah"
            SET "koordinatPolygon" = ST_SetSRID(ST_GeomFromGeoJSON(${geojsonStr}), 4326),
                "updatedAt" = NOW()
            WHERE id = ${targetAsset.id}
          `;
          polygonAppliedCount++;
        } catch (e) {
          console.error(`Gagal menerapkan poligon untuk ${targetAsset.namaBarang}:`, e.message);
        }
      }
    }
    console.log(`[Poligon Spasial] Selesai: ${polygonAppliedCount} aset berhasil dipetakan poligon aslinya.`);
  }

  return { createdCount, updatedCount, certUpdatedCount, polygonAppliedCount };
}

if (require.main === module) {
  syncAll()
    .then((res) => {
      console.log('\n=== SEMUA SINKRONISASI DATABASE SELESAI DENGAN SUKSES ===');
      console.log(JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error saat sinkronisasi:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { syncAll };
