import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import crypto from 'crypto';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Sesi tidak sah atau telah berakhir. Silakan login terlebih dahulu.' }, 
        { status: 401 }
      );
    }

    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // 1. Validasi Ukuran File (Mencegah DoS / Disk Flooding)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file melebihi batas maksimal 15 MB.' }, 
        { status: 400 }
      );
    }

    // 2. Validasi Ekstensi & MIME Type (Mencegah Arbitrary File Upload & Stored XSS)
    const ext = extname(file.name || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Tipe ekstensi file "${ext}" tidak diizinkan. Hanya PDF, JPG, PNG, dan WebP yang diperbolehkan.` }, 
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `MIME type "${file.type}" tidak valid atau berisiko.` }, 
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Nama File Acak Kriptografis (Mencegah Path Traversal & Penimpaan File)
    const uniqueFilename = `pasti_${Date.now()}_${crypto.randomUUID()}${ext}`;
    
    // Path penyimpanan: public/uploads/filename
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const fullPath = join(uploadDir, uniqueFilename);

    await writeFile(fullPath, buffer);

    // Kembalikan URL publik yang aman
    return NextResponse.json({ 
      success: true, 
      url: `/uploads/${uniqueFilename}`,
      filename: uniqueFilename,
      size: file.size
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Gagal mengunggah file' }, { status: 500 });
  }
}
