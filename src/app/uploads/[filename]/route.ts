import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('File path tidak sah', { status: 400 });
    }

    const filePath = join(process.cwd(), 'public', 'uploads', filename);

    try {
      await stat(filePath);
    } catch {
      return new NextResponse('File tidak ditemukan', { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const ext = extname(filename).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving upload file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

