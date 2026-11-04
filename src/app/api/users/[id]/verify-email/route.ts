import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak sah. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const currentRole = (session.user as any)?.role;
    if (currentRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin yang berhak memverifikasi email pengguna.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const newStatus = !user.isEmailVerified;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isEmailVerified: newStatus,
        emailVerifiedAt: newStatus ? new Date() : null,
        emailVerificationToken: newStatus ? null : crypto.randomUUID(),
      },
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        emailVerifiedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: newStatus 
        ? `Email ${updatedUser.email} (${updatedUser.name}) berhasil diverifikasi!`
        : `Status verifikasi email ${updatedUser.email} dinonaktifkan.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error toggling email verification:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status verifikasi email.' }, { status: 500 });
  }
}

