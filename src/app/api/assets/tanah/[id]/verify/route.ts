import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak sah. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const currentRole = (session.user as any)?.role;
    // Hanya Verifikator dan Super Admin yang berhak memverifikasi aset
    if (currentRole !== 'VERIFICATOR' && currentRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Verifikator atau Super Admin yang berhak memvalidasi/memverifikasi aset.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json({ error: 'ID aset tidak valid.' }, { status: 400 });
    }

    const body = await request.json();
    const { statusVerifikasi, catatanVerifikasi } = body;

    if (!statusVerifikasi || !['TERVERIFIKASI', 'DITOLAK', 'MENUNGGU_VERIFIKASI'].includes(statusVerifikasi)) {
      return NextResponse.json(
        { error: 'Status verifikasi harus berupa TERVERIFIKASI, DITOLAK, atau MENUNGGU_VERIFIKASI.' },
        { status: 400 }
      );
    }

    const verifierName = session.user?.name || session.user?.email || 'Verifikator';

    const updatedTanah = await prisma.tanah.update({
      where: { id },
      data: {
        statusVerifikasi,
        catatanVerifikasi: catatanVerifikasi || (statusVerifikasi === 'TERVERIFIKASI' ? 'Disetujui dan diverifikasi oleh Verifikator' : 'Perlu perbaikan data'),
        verifiedBy: verifierName,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: statusVerifikasi === 'TERVERIFIKASI' 
        ? `Aset ${updatedTanah.namaBarang} berhasil diverifikasi & disetujui!` 
        : `Aset ${updatedTanah.namaBarang} ditandai butuh revisi/ditolak.`,
      tanah: updatedTanah,
    });
  } catch (error) {
    console.error('Error verifying asset:', error);
    return NextResponse.json({ error: 'Gagal memverifikasi aset.' }, { status: 500 });
  }
}

