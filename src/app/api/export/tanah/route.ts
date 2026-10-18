import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
      'NIBAR',
      'Nama Aset / Barang',
      'Kode Lokasi',
      'Status Hak',
      'Luas (m2)',
      'Status Legalitas',
      'Nomor Sertifikat',
      'Alamat Lokasi',
      'Asal Perolehan',
      'Nilai Perolehan (Rp)',
      'Tanggal Perolehan',
      'Dokumen Sertifikat',
      'Foto Fisik Aset',
      'Tanggal Terdaftar',
    ];

    const escapeCSV = (field: any) => {
      if (field === null || field === undefined) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = assets.map((a) => [
      escapeCSV(a.nibar),
      escapeCSV(a.namaBarang),
      escapeCSV(a.kodeLokasi || '-'),
      escapeCSV(a.statusHak || '-'),
      escapeCSV(a.luas || 0),
      escapeCSV(a.statusLegalitas || '-'),
      escapeCSV(a.noSertifikat || '-'),
      escapeCSV(a.alamatLokasi || '-'),
      escapeCSV(a.asalPerolehan || '-'),
      escapeCSV(a.nilaiPerolehan || 0),
      escapeCSV(a.tanggalPerolehan ? new Date(a.tanggalPerolehan).toISOString().split('T')[0] : '-'),
      escapeCSV(a.dokumenSertifikat ? `${process.env.NEXTAUTH_URL || ''}${a.dokumenSertifikat}` : '-'),
      escapeCSV(a.fotoAset ? `${process.env.NEXTAUTH_URL || ''}${a.fotoAset}` : '-'),
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
