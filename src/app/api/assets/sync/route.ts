import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncAll } from '../../../../../scripts/sync_production_db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Fitur ini hanya dapat diakses oleh Super Admin.' },
        { status: 403 }
      );
    }

    const result = await syncAll();
    return NextResponse.json({
      success: true,
      message: 'Sinkronisasi 40 Master Aset dan 24 Dokumen Sertifikat berhasil dijalankan!',
      data: result
    });
  } catch (error: any) {
    console.error('Error saat sync database:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal melakukan sinkronisasi database' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

