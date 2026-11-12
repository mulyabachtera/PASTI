/**
 * Script Pengimporan 40 Master Aset Strategis Tanah Pemkab Aceh Tengah
 * Sumber: Data Base SIM PASTI (IAN).xlsx
 * 
 * Aturan Pemetaan:
 * 1. Asset ID = ID Tanah dari Excel (contoh: 120111043200000000000019901310101040010000001)
 * 2. NIBAR = ID Tanah (untuk baris yang memiliki ID) atau BELUM-ADA-xx (untuk 7 baris tanpa ID)
 * 3. Nama Aset = `${Nama Lahan} / ${Nama Barang}` (atau ${Nama Barang} jika Nama Lahan kosong)
 * 4. Nilai Perolehan & Tanggal Perolehan dari Sheet1 KIB A
 * 5. Pengelola dari Status Penggunaan Sheet1
 * 6. Dokumen Sertifikat & Polygon Koordinat dikosongkan sementara (kecuali BPKK yang sudah ada)
 * 7. Aset eksisting BPKK (e3db500d-49e1-46e4-83d6-da9a8d4de68f) di-update tanpa menghapus file PDF sertifikat & foto aset.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  const jsonPath = path.join(__dirname, 'extracted_40_assets.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File ${jsonPath} tidak ditemukan!`);
  }

  const items = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Memulai proses impor ${items.length} data master aset tanah...`);

  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const rowNum = it.row;
    const isFirstRow = (i === 0); // Row 5 = BPKK

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

    // Status Hak: jika baris 11 (Hak Pakai No. 1) atau status_legalitas Hak Pakai
    let statusHak = it.status_hak ? String(it.status_hak).trim() : 'Hak Milik';
    if (it.status_legalitas === 'Hak Pakai' || (it.nama_barang && it.nama_barang.includes('Hak Pakai'))) {
      statusHak = 'Hak Pakai';
    }

    // Status Legalitas
    let statusLegalitas = 'Belum Bersertifikat';
    if (it.status_legalitas === 'Sertifikat' || it.status_legalitas === 'Hak Pakai' || noSertifikat) {
      statusLegalitas = 'Sertifikat';
    }

    // Tanggal Perolehan
    let tanggalPerolehan = null;
    if (it.tanggal_perolehan) {
      const parsed = new Date(it.tanggal_perolehan);
      if (!isNaN(parsed.getTime())) {
        tanggalPerolehan = parsed;
      }
    }

    if (isFirstRow) {
      // Row 5: BPKK - Update aset eksisting e3db500d-49e1-46e4-83d6-da9a8d4de68f
      const existingBpk = await prisma.tanah.findUnique({
        where: { id: 'e3db500d-49e1-46e4-83d6-da9a8d4de68f' }
      });

      if (existingBpk) {
        // Hitung ulang risiko dengan parameter fisik eksisting + status legalitas & nilai perolehan riil
        const risk = calculateRisk({
          papanAset: existingBpk.papanAset ?? 0,
          batasBidang: existingBpk.batasBidang ?? 1,
          pagarPengamanan: existingBpk.pagarPengamanan ?? 0,
          statusPenguasaan: existingBpk.statusPenguasaan ?? 1,
          pemanfaatan: existingBpk.pemanfaatan ?? 0,
          statusLegalitas,
          nilaiPerolehan
        });

        await prisma.tanah.update({
          where: { id: existingBpk.id },
          data: {
            assetId,
            nibar,
            kodeTanah: kodeTanah || existingBpk.kodeTanah,
            kodeBarang: kodeTanah || existingBpk.kodeBarang,
            namaBarang,
            pengelola: pengelola || existingBpk.pengelola,
            luas: luas || existingBpk.luas,
            statusHak,
            noSertifikat: noSertifikat || existingBpk.noSertifikat,
            nilaiPerolehan: nilaiPerolehan || existingBpk.nilaiPerolehan,
            asalPerolehan: asalPerolehan || existingBpk.asalPerolehan,
            tanggalPerolehan: tanggalPerolehan || existingBpk.tanggalPerolehan,
            alamatLokasi: alamatLokasi || existingBpk.alamatLokasi,
            kecamatan: kecamatan || existingBpk.kecamatan,
            kabKota,
            provinsi,
            statusLegalitas,
            // Pertahankan dokumen & foto:
            // dokumenSertifikat: existingBpk.dokumenSertifikat
            // fotoAset: existingBpk.fotoAset
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
            verifiedBy: 'Mulya Bachtera, S. Inf',
            verifiedAt: existingBpk.verifiedAt || new Date()
          }
        });

        console.log(`[UPDATE BPKK] Berhasil memperbarui aset ID: ${existingBpk.id} | Asset ID: ${assetId} | Nama: ${namaBarang}`);
        updatedCount++;
        continue;
      }
    }

    // Untuk 39 aset lainnya
    // Cek apakah sudah pernah diimpor sebelumnya berdasarkan nibar atau assetId
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
        where: { nibar }
      });
    }

    const physicalInput = {
      papanAset: 0,
      batasBidang: 0,
      pagarPengamanan: 0,
      statusPenguasaan: 0,
      pemanfaatan: 0,
      statusLegalitas,
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
          pengelola,
          luas,
          statusHak,
          noSertifikat,
          nilaiPerolehan,
          asalPerolehan,
          tanggalPerolehan,
          alamatLokasi,
          kecamatan,
          kabKota,
          provinsi,
          statusLegalitas,
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
      console.log(`[UPDATE] ${i + 1}. [Row ${rowNum}] Asset ID: ${assetId.substring(0, 15)}... | Nama: ${namaBarang}`);
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
          tanggalPerolehan,
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
      console.log(`[CREATE] ${i + 1}. [Row ${rowNum}] Asset ID: ${assetId.substring(0, 15)}... | Nama: ${namaBarang}`);
      createdCount++;
    }
  }

  console.log(`\n=== IMPOR SELESAI ===`);
  console.log(`Total Aset Diproses: ${items.length}`);
  console.log(`Aset Baru Dibuat: ${createdCount}`);
  console.log(`Aset Diperbarui: ${updatedCount}`);
}

main()
  .catch((err) => {
    console.error('Error saat proses impor:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

