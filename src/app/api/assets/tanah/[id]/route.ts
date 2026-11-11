import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak sah atau telah berakhir. Silakan login terlebih dahulu." }, 
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json({ error: "ID aset tidak valid" }, { status: 400 });
    }

    const data = await request.json();
    
    // Parameter Fisik (0 - 2) jika disertakan
    const pAset = data.papanAset !== undefined ? Number(data.papanAset) : undefined;
    const bBidang = data.batasBidang !== undefined ? Number(data.batasBidang) : undefined;
    const pPagar = data.pagarPengamanan !== undefined ? Number(data.pagarPengamanan) : undefined;
    const sPenguasaan = data.statusPenguasaan !== undefined ? Number(data.statusPenguasaan) : undefined;
    const pManfaat = data.pemanfaatan !== undefined ? Number(data.pemanfaatan) : undefined;
    const nilaiPerolehan = data.nilaiPerolehan ? parseFloat(data.nilaiPerolehan) : null;

    // Kalkulasi ulang risiko jika ada parameter fisik yang dikirimkan
    let riskScores: any = {};
    if (pAset !== undefined || bBidang !== undefined || pPagar !== undefined || sPenguasaan !== undefined || pManfaat !== undefined) {
      const { calculateAutomatedRisk } = await import('@/lib/riskCalculator');
      const calc = calculateAutomatedRisk({
        papanAset: pAset ?? 0,
        batasBidang: bBidang ?? 0,
        pagarPengamanan: pPagar ?? 0,
        statusPenguasaan: sPenguasaan ?? 0,
        pemanfaatan: pManfaat ?? 0,
        statusLegalitas: data.statusLegalitas,
        nilaiPerolehan: nilaiPerolehan || 0,
      });

      riskScores = {
        skorAdministrasi: calc.skorAdministrasi,
        skorLegal: calc.skorLegal,
        skorFisik: calc.skorFisik,
        skorPenguasaan: calc.skorPenguasaan,
        skorSengketa: calc.skorSengketa,
        skorStrategis: calc.skorStrategis,
        totalSkorRisiko: calc.totalSkor,
        kategoriRisiko: calc.kategoriRisiko,
        prioritasTindakan: calc.prioritasTindakan,
      };
    }

    // Clean up data to match Prisma schema
    const updateData: any = {
      namaBarang: data.namaBarang,
      assetId: data.assetId !== undefined ? (data.assetId?.trim() ? data.assetId.trim() : "-") : undefined,
      nibar: data.nibar !== undefined ? (data.nibar?.trim() ? data.nibar.trim() : "-") : undefined,
      kodeTanah: data.kodeTanah !== undefined ? data.kodeTanah : (data.kodeBarang !== undefined ? data.kodeBarang : undefined),
      kodeBarang: data.kodeTanah !== undefined ? data.kodeTanah : (data.kodeBarang !== undefined ? data.kodeBarang : undefined),
      pengelola: data.pengelola !== undefined ? data.pengelola : undefined,
      kecamatan: data.kecamatan !== undefined ? data.kecamatan : undefined,
      kampung: data.kampung !== undefined ? data.kampung : undefined,
      statusHak: data.statusHak || null,
      luas: data.luas ? parseFloat(data.luas) : null,
      statusLegalitas: data.statusLegalitas || null,
      noSertifikat: data.noSertifikat || null,
      tanggalPerolehan: data.tanggalPerolehan ? new Date(data.tanggalPerolehan) : null,
      alamatLokasi: data.alamatLokasi || null,
      asalPerolehan: data.asalPerolehan || null,
      nilaiPerolehan,
      dokumenSertifikat: data.dokumenSertifikat !== undefined ? data.dokumenSertifikat : undefined,
      fotoAset: data.fotoAset !== undefined ? data.fotoAset : undefined,
      papanAset: pAset,
      batasBidang: bBidang,
      pagarPengamanan: pPagar,
      statusPenguasaan: sPenguasaan,
      pemanfaatan: pManfaat,
      permasalahan: data.permasalahan !== undefined ? data.permasalahan : undefined,
      ...riskScores,
    };

    // Jika yang mengedit adalah Operator, kembalikan status menjadi MENUNGGU_VERIFIKASI untuk ditelaah ulang Verifikator
    const userRole = (session.user as any)?.role;
    const userName = session.user?.name || session.user?.email || 'Operator';
    if (userRole === 'OPERATOR') {
      updateData.statusVerifikasi = 'MENUNGGU_VERIFIKASI';
      updateData.inputBy = userName;
    }

    const updated = await prisma.tanah.update({
      where: { id },
      data: updateData
    });

    // Update PostGIS Polygon if provided
    if (data.geojson) {
      const geojsonString = typeof data.geojson === 'string' ? data.geojson : JSON.stringify(data.geojson);
      await prisma.$executeRaw`
        UPDATE "tanah"
        SET "koordinatPolygon" = ST_GeomFromGeoJSON(${geojsonString}),
            "updatedAt" = NOW()
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json({ error: "Gagal memperbarui aset" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak sah atau telah berakhir. Silakan login terlebih dahulu." }, 
        { status: 401 }
      );
    }

    // Role-based authorization: Hanya Super Admin dan Admin Instansi yang boleh menghapus aset
    const role = (session.user as any)?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN_PEMERINTAH') {
      return NextResponse.json(
        { error: "Akses ditolak. Anda tidak memiliki wewenang untuk menghapus aset daerah." }, 
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json({ error: "ID aset tidak valid" }, { status: 400 });
    }

    // Delete the asset from the database
    await prisma.tanah.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Aset berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json({ error: "Gagal menghapus aset" }, { status: 500 });
  }
}
