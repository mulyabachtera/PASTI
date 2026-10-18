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

    const risks = await prisma.riskRegister.findMany({
      include: {
        tanah: {
          select: {
            namaBarang: true,
            nibar: true,
            alamatLokasi: true,
          },
        },
      },
      orderBy: { skorTotal: 'desc' },
    });

    const headers = [
      'Tingkat Risiko',
      'Skor Total (1-25)',
      'Skor Dampak (1-5)',
      'Skor Peluang (1-5)',
      'Kategori Risiko',
      'Deskripsi Kasus Risiko',
      'NIBAR Aset Terkait',
      'Nama Aset Terkait',
      'Alamat Lokasi Aset',
      'Tanggal Teridentifikasi',
    ];

    const escapeCSV = (field: any) => {
      if (field === null || field === undefined) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = risks.map((r) => [
      escapeCSV(r.tingkatRisiko.toUpperCase()),
      escapeCSV(r.skorTotal),
      escapeCSV(r.skorDampak),
      escapeCSV(r.skorPeluang),
      escapeCSV(r.kategoriRisiko),
      escapeCSV(r.deskripsiRisiko),
      escapeCSV(r.tanah?.nibar || '-'),
      escapeCSV(r.tanah?.namaBarang || '-'),
      escapeCSV(r.tanah?.alamatLokasi || '-'),
      escapeCSV(r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '-'),
    ].join(','));

    // UTF-8 BOM + CSV string
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    const filename = `Laporan_Risk_Register_PASTI_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting risk CSV:', error);
    return NextResponse.json({ error: 'Gagal mengekspor data risiko' }, { status: 500 });
  }
}
