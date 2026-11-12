import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parseFotoList } from '@/lib/photoUtils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak sah atau telah berakhir. Silakan login terlebih dahulu." }, 
        { status: 401 }
      );
    }

    const assets = await prisma.tanah.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // CSV Header with BOM for Excel compatibility
    const headers = [
      'Asset ID',
      'NIBAR',
      'Kode Tanah',
      'Nama Aset / Barang',
      'Pengelola (OPD)',
      'Kecamatan',
      'Kampung / Desa',
      'Kode Lokasi',
      'Status Hak',
      'Luas (m2)',
      'Status Legalitas',
      'Nomor Sertifikat',
      'Alamat Lokasi',
      'Asal Perolehan',
      'Nilai Perolehan (Rp)',
      'Tanggal Perolehan',
      'Status Verifikasi',
      'Diinput Oleh',
      'Diverifikasi Oleh',
      'Total Skor Risiko (6-30)',
      'Kategori Risiko',
      'Prioritas Tindakan',
      'Dokumen Sertifikat',
      'Foto Fisik Aset',
      'Tanggal Terdaftar',
    ];

    const escapeCSV = (field: unknown) => {
      if (field === null || field === undefined) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = assets.map((a) => [
      escapeCSV(a.assetId || '-'),
      escapeCSV(a.nibar),
      escapeCSV(a.kodeTanah || '-'),
      escapeCSV(a.namaBarang),
      escapeCSV(a.pengelola || '-'),
      escapeCSV(a.kecamatan || '-'),
      escapeCSV(a.kampung || '-'),
      escapeCSV(a.kodeLokasi || '-'),
      escapeCSV(a.statusHak || '-'),
      escapeCSV(a.luas || 0),
      escapeCSV(a.statusLegalitas || '-'),
      escapeCSV(a.noSertifikat || '-'),
      escapeCSV(a.alamatLokasi || '-'),
      escapeCSV(a.asalPerolehan || '-'),
      escapeCSV(a.nilaiPerolehan || 0),
      escapeCSV(a.tanggalPerolehan ? new Date(a.tanggalPerolehan).toISOString().split('T')[0] : '-'),
      escapeCSV(a.statusVerifikasi || 'TERVERIFIKASI'),
      escapeCSV(a.inputBy || '-'),
      escapeCSV(a.verifiedBy || '-'),
      escapeCSV(a.totalSkorRisiko || '-'),
      escapeCSV(a.kategoriRisiko || '-'),
      escapeCSV(a.prioritasTindakan || '-'),
      escapeCSV(a.dokumenSertifikat ? `${process.env.NEXTAUTH_URL || ''}${a.dokumenSertifikat}` : '-'),
      escapeCSV(
        parseFotoList(a.fotoAset).length > 0 
          ? parseFotoList(a.fotoAset).map(p => `${process.env.NEXTAUTH_URL || ''}${p}`).join('; ') 
          : '-'
      ),
      escapeCSV(a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '-'),
    ].join(','));

    // UTF-8 BOM + CSV string
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    const filename = `Laporan_Master_Tanah_PASTI_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting tanah CSV:', error);
    return NextResponse.json({ error: 'Gagal mengekspor data tanah' }, { status: 500 });
  }
}
