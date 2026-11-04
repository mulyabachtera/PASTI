import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak sah. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin yang berhak mengelola akun pengguna.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pengguna.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak sah. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin yang berhak menambahkan akun pengguna.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role: userRole } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama pengguna wajib diisi.' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
    }

    // Validasi format role
    const validRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.VERIFICATOR,
      Role.OPERATOR,
      Role.ADMIN_PEMERINTAH,
      Role.VENDOR_SWASTA,
    ];
    if (!userRole || !validRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Peran (Role) yang dipilih tidak valid.' }, { status: 400 });
    }

    // Cek duplikasi email
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: `Email ${email} sudah terdaftar di sistem.` }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: userRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${newUser.name} (${newUser.role}) berhasil dibuat!`,
      user: newUser,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Gagal membuat akun pengguna.' }, { status: 500 });
  }
}

