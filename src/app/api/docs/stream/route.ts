import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

// Helper untuk mencegah SSRF (Server-Side Request Forgery)
function isDisallowedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower.startsWith("10.") ||
    lower.startsWith("192.168.") ||
    lower.startsWith("172.16.") ||
    lower.startsWith("172.17.") ||
    lower.startsWith("172.18.") ||
    lower.startsWith("172.19.") ||
    lower.startsWith("172.20.") ||
    lower.startsWith("172.21.") ||
    lower.startsWith("172.22.") ||
    lower.startsWith("172.23.") ||
    lower.startsWith("172.24.") ||
    lower.startsWith("172.25.") ||
    lower.startsWith("172.26.") ||
    lower.startsWith("172.27.") ||
    lower.startsWith("172.28.") ||
    lower.startsWith("172.29.") ||
    lower.startsWith("172.30.") ||
    lower.startsWith("172.31.") ||
    lower.startsWith("169.254.") // AWS/Cloud Metadata IP
  );
}

export async function GET(request: NextRequest) {
  try {
    // 1. Validasi Autentikasi Sesi
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Sesi tidak sah atau telah berakhir." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Retrieve target parameter (either base64-encoded or raw file path)
    let target = searchParams.get("target");
    if (target) {
      try {
        const decoded = Buffer.from(target, "base64").toString("utf-8");
        // Only use decoded if it looks like a path or url
        if (decoded.includes("/") || decoded.includes("\\")) {
          target = decoded;
        }
      } catch {
        // keep as is
      }
    } else {
      target = searchParams.get("file");
    }

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Parameter dokumen tidak ditentukan." },
        { status: 400 }
      );
    }

    let buffer: Buffer;

    // 2. Proteksi SSRF untuk Dokumen Eksternal
    if (target.startsWith("http://") || target.startsWith("https://")) {
      try {
        const parsedUrl = new URL(target);
        if (isDisallowedHost(parsedUrl.hostname)) {
          return NextResponse.json(
            { success: false, error: "Akses ke host internal/privat diblokir (Proteksi SSRF)." },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "Format URL dokumen tidak valid." },
          { status: 400 }
        );
      }

      const response = await fetch(target);
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: `Gagal mengunduh dokumen eksternal: ${response.statusText}` },
          { status: 502 }
        );
      }
      const arrayBuf = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuf);
    } else {
      // 3. Proteksi Path Traversal Menyeluruh untuk Dokumen Lokal
      const publicDir = path.resolve(process.cwd(), "public");
      const clean = target.startsWith("/") ? target.slice(1) : target;
      const fullPath = path.resolve(publicDir, clean);

      // Verifikasi bahwa jalur fisik file berada di dalam folder public/
      if (!fullPath.startsWith(publicDir)) {
        return NextResponse.json(
          { success: false, error: "Akses direktori tidak sah (Directory Traversal Terdeteksi)." },
          { status: 403 }
        );
      }

      try {
        buffer = await fs.readFile(fullPath);
      } catch {
        return NextResponse.json(
          { success: false, error: "Dokumen tidak ditemukan pada penyimpanan server." },
          { status: 404 }
        );
      }
    }

    // Kembalikan stream biner langsung (C++ native arrayBuffer di browser, 100x lebih cepat dari base64 JSON)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff"
      },
    });
  } catch (err: any) {
    console.error("API docs/stream error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memproses dokumen." },
      { status: 500 }
    );
  }
}
