import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

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
    if (currentRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin yang berhak mengubah data pengguna.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json({ error: 'ID pengguna tidak valid.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, role, password } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });
    if (!existingUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Jika ganti email, pastikan tidak bentrok dengan user lain
    if (email && email.trim().toLowerCase() !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (emailConflict) {
        return NextResponse.json({ error: 'Email sudah digunakan oleh akun lain.' }, { status: 409 });
      }
    }

    const updateData: any = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (email && email.trim()) updateData.email = email.trim().toLowerCase();
    if (role) {
      const validRoles: Role[] = [
        Role.SUPER_ADMIN,
        Role.VERIFICATOR,
        Role.OPERATOR,
        Role.ADMIN_PEMERINTAH,
        Role.VENDOR_SWASTA,
      ];
      if (validRoles.includes(role)) {
        updateData.role = role;
      }
    }
    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password baru minimal 6 karakter.' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui!',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengguna.' }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin yang berhak menghapus akun pengguna.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json({ error: 'ID pengguna tidak valid.' }, { status: 400 });
    }

    // Cegah Super Admin menghapus akunnya sendiri
    const currentUserId = (session.user as any)?.id;
    const currentUserEmail = session.user?.email;

    const userToDelete = await prisma.user.findUnique({
      where: { id },
    });
    if (!userToDelete) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    if (userToDelete.id === currentUserId || userToDelete.email === currentUserEmail) {
      return NextResponse.json(
        { error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${userToDelete.name} (${userToDelete.email}) berhasil dihapus.`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Gagal menghapus pengguna.' }, { status: 500 });
  }
}

