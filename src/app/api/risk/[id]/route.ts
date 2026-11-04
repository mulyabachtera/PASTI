import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak sah atau telah berakhir. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const risk = await prisma.riskRegister.findUnique({
      where: { id },
      include: {
        tanah: {
          select: {
            id: true,
            assetId: true,
            kodeTanah: true,
            namaBarang: true,
            nibar: true,
            alamatLokasi: true,
          }
        }
      }
    });

    if (!risk) {
      return NextResponse.json({ error: "Data risiko tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(risk);
  } catch (error) {
    console.error("Error fetching risk:", error);
    return NextResponse.json({ error: "Gagal mengambil data risiko" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak sah atau telah berakhir. Silakan login terlebih dahulu." }, 
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      kategoriRisiko, 
      deskripsiRisiko, 
      skorDampak, 
      skorPeluang,
      penyebab,
      dampakNarasi,
      existingControl,
      statusTindakLanjut,
      pic,
      targetSelesai,
    } = body;

    if (!deskripsiRisiko || typeof deskripsiRisiko !== 'string' || !deskripsiRisiko.trim()) {
      return NextResponse.json({ error: "Deskripsi risiko wajib diisi." }, { status: 400 });
    }

    // Hitung ulang skor total & tingkat risiko
    const rawD = Number(skorDampak) || 1;
    const rawP = Number(skorPeluang) || 1;
    const d = Math.min(5, Math.max(1, rawD));
    const p = Math.min(5, Math.max(1, rawP));
    const skorTotal = d * p;

    let tingkatRisiko = "LOW";
    if (skorTotal >= 15) tingkatRisiko = "EXTREME";
    else if (skorTotal >= 10) tingkatRisiko = "HIGH";
    else if (skorTotal >= 5) tingkatRisiko = "MEDIUM";

    const updated = await prisma.riskRegister.update({
      where: { id },
      data: {
        kategoriRisiko: kategoriRisiko || 'Lainnya',
        deskripsiRisiko: deskripsiRisiko.trim(),
        penyebab: penyebab ? String(penyebab).trim() : null,
        dampakNarasi: dampakNarasi ? String(dampakNarasi).trim() : null,
        existingControl: existingControl ? String(existingControl).trim() : null,
        statusTindakLanjut: statusTindakLanjut || 'Belum Ditindaklanjuti',
        pic: pic ? String(pic).trim() : 'BPKAD Bidang Aset',
        targetSelesai: targetSelesai ? new Date(targetSelesai) : null,
        skorDampak: d,
        skorPeluang: p,
        skorTotal,
        tingkatRisiko
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Data risiko berhasil diperbarui!", 
      data: updated 
    });
  } catch (error) {
    console.error("Error updating risk:", error);
    return NextResponse.json({ error: "Gagal memperbarui data risiko" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak sah atau telah berakhir. Silakan login terlebih dahulu." }, 
        { status: 401 }
      );
    }

    const role = (session.user as { role?: string })?.role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN_PEMERINTAH" && role !== "VERIFICATOR") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Admin atau Verifikator yang dapat menghapus data risiko." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await prisma.riskRegister.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Data risiko berhasil dihapus!" });
  } catch (error) {
    console.error("Error deleting risk:", error);
    return NextResponse.json({ error: "Gagal menghapus data risiko" }, { status: 500 });
  }
}
