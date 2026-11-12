import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { calculateAutomatedRisk } from '@/lib/riskCalculator';

export async function POST(request: Request) {
  try {
    // 1. Validasi Autentikasi Sesi
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak sah atau telah berakhir. Silakan login terlebih dahulu." }, 
        { status: 401 }
      );
    }

    const data = await request.json();

    if (!data.namaBarang || typeof data.namaBarang !== 'string' || !data.namaBarang.trim()) {
      return NextResponse.json(
        { error: "Nama aset/barang wajib diisi." }, 
        { status: 400 }
      );
    }
    
    const id = uuidv4();
    const nibar = data.nibar?.trim() ? data.nibar.trim() : "-";
    const assetId = data.assetId?.trim() ? data.assetId.trim() : "-";
    const kodeTanah = data.kodeTanah?.trim() || data.kodeBarang?.trim() || "-";
    const luas = data.luas && !isNaN(parseFloat(data.luas)) ? Math.max(0, parseFloat(data.luas)) : null;
    const nilaiPerolehan = data.nilaiPerolehan && !isNaN(parseFloat(data.nilaiPerolehan)) ? Math.max(0, parseFloat(data.nilaiPerolehan)) : null;
    const tanggalPerolehan = data.tanggalPerolehan ? new Date(data.tanggalPerolehan) : null;

    // Format aman fotoAset (Mendukung JSON array string atau array objek)
    const fotoAsetVal = Array.isArray(data.fotoAset)
      ? JSON.stringify(data.fotoAset)
      : (typeof data.fotoAset === 'string' && data.fotoAset.trim() ? data.fotoAset.trim() : null);

    // Parameter Fisik (0 - 2)
    const papanAset = Number(data.papanAset ?? 0);
    const batasBidang = Number(data.batasBidang ?? 0);
    const pagarPengamanan = Number(data.pagarPengamanan ?? 0);
    const statusPenguasaan = Number(data.statusPenguasaan ?? 0);
    const pemanfaatan = Number(data.pemanfaatan ?? 0);
    const permasalahan = data.permasalahan || null;
    const pengelola = data.pengelola || null;
    const kecamatan = data.kecamatan || null;
    const kampung = data.kampung || null;

    // Kalkulasi Otomasi 6 Dimensi Risiko
    const risk = calculateAutomatedRisk({
      papanAset,
      batasBidang,
      pagarPengamanan,
      statusPenguasaan,
      pemanfaatan,
      statusLegalitas: data.statusLegalitas,
      nilaiPerolehan: nilaiPerolehan || 0,
    });

    // Parameter Verifikasi Sesuai Peran Penginput
    const userRole = (session.user as any)?.role;
    const userName = session.user?.name || session.user?.email || 'Pengguna';
    const isOperator = userRole === 'OPERATOR';
    const statusVerifikasi = isOperator ? 'MENUNGGU_VERIFIKASI' : 'TERVERIFIKASI';
    const inputBy = userName;
    const verifiedBy = isOperator ? null : userName;
    const verifiedAt = isOperator ? null : new Date();

    if (data.geojson) {
      // With Map Polygon
      const geojsonString = typeof data.geojson === 'string' ? data.geojson : JSON.stringify(data.geojson);
      await prisma.$executeRaw`
        INSERT INTO "tanah" (
          "id", "nibar", "assetId", "kodeTanah", "namaBarang", "kodeLokasi", "kodeBarang",
          "pengelola", "kecamatan", "kampung", "statusHak", "luas",
          "statusLegalitas", "noSertifikat", "alamatLokasi", "asalPerolehan",
          "nilaiPerolehan", "tanggalPerolehan", "dokumenSertifikat", "fotoAset",
          "papanAset", "batasBidang", "pagarPengamanan", "statusPenguasaan", "pemanfaatan", "permasalahan",
          "skorAdministrasi", "skorLegal", "skorFisik", "skorPenguasaan", "skorSengketa", "skorStrategis",
          "totalSkorRisiko", "kategoriRisiko", "prioritasTindakan",
          "statusVerifikasi", "inputBy", "verifiedBy", "verifiedAt",
          "createdAt", "updatedAt", "koordinatPolygon"
        )
        VALUES (
          ${id}, ${nibar}, ${assetId}, ${kodeTanah}, ${data.namaBarang || 'Aset Tanah Baru'}, ${data.kodeLokasi || null}, ${kodeTanah},
          ${pengelola}, ${kecamatan}, ${kampung}, ${data.statusHak || 'Belum Terverifikasi'}, ${luas},
          ${data.statusLegalitas || null}, ${data.noSertifikat || null}, ${data.alamatLokasi || null}, ${data.asalPerolehan || null},
          ${nilaiPerolehan}, ${tanggalPerolehan}, ${data.dokumenSertifikat || null}, ${fotoAsetVal},
          ${papanAset}, ${batasBidang}, ${pagarPengamanan}, ${statusPenguasaan}, ${pemanfaatan}, ${permasalahan},
          ${risk.skorAdministrasi}, ${risk.skorLegal}, ${risk.skorFisik}, ${risk.skorPenguasaan}, ${risk.skorSengketa}, ${risk.skorStrategis},
          ${risk.totalSkor}, ${risk.kategoriRisiko}, ${risk.prioritasTindakan},
          ${statusVerifikasi}, ${inputBy}, ${verifiedBy}, ${verifiedAt},
          NOW(), NOW(), ST_GeomFromGeoJSON(${geojsonString})
        )
      `;
    } else {
      // Text only via form
      await prisma.tanah.create({
        data: {
          id,
          nibar,
          assetId,
          kodeTanah,
          kodeBarang: kodeTanah,
          namaBarang: data.namaBarang || 'Aset Tanah Baru',
          kodeLokasi: data.kodeLokasi || null,
          pengelola,
          kecamatan,
          kampung,
          statusHak: data.statusHak || 'Belum Terverifikasi',
          luas,
          statusLegalitas: data.statusLegalitas || null,
          noSertifikat: data.noSertifikat || null,
          alamatLokasi: data.alamatLokasi || null,
          asalPerolehan: data.asalPerolehan || null,
          nilaiPerolehan,
          tanggalPerolehan,
          dokumenSertifikat: data.dokumenSertifikat || null,
          fotoAset: fotoAsetVal,
          papanAset,
          batasBidang,
          pagarPengamanan,
          statusPenguasaan,
          pemanfaatan,
          permasalahan,
          skorAdministrasi: risk.skorAdministrasi,
          skorLegal: risk.skorLegal,
          skorFisik: risk.skorFisik,
          skorPenguasaan: risk.skorPenguasaan,
          skorSengketa: risk.skorSengketa,
          skorStrategis: risk.skorStrategis,
          totalSkorRisiko: risk.totalSkor,
          kategoriRisiko: risk.kategoriRisiko,
          prioritasTindakan: risk.prioritasTindakan,
          statusVerifikasi,
          inputBy,
          verifiedBy,
          verifiedAt,
        }
      });
    }

    return NextResponse.json({ success: true, message: "Aset berhasil disimpan!", id });
  } catch (error) {
    console.error("Error saving asset:", error);
    return NextResponse.json({ error: "Gagal menyimpan aset" }, { status: 500 });
  }
}
