import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak sah atau telah berakhir. Silakan login terlebih dahulu." }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      idTanah, 
      kategoriRisiko, 
      deskripsiRisiko, 
      skorDampak, 
      skorPeluang,
      riskId,
      penyebab,
      dampakNarasi,
      existingControl,
      statusTindakLanjut,
      pic,
      targetSelesai,
    } = body;
    
    if (!idTanah || !deskripsiRisiko || typeof deskripsiRisiko !== 'string' || !deskripsiRisiko.trim()) {
      return NextResponse.json({ error: "Data aset dan deskripsi risiko wajib diisi." }, { status: 400 });
    }

    // Validasi range skor matriks risiko 1 - 5
    const rawD = Number(skorDampak) || 1;
    const rawP = Number(skorPeluang) || 1;
    const d = Math.min(5, Math.max(1, rawD));
    const p = Math.min(5, Math.max(1, rawP));
    const skorTotal = d * p;

    let tingkatRisiko = "LOW";
    if (skorTotal >= 15) tingkatRisiko = "EXTREME";
    else if (skorTotal >= 10) tingkatRisiko = "HIGH";
    else if (skorTotal >= 5) tingkatRisiko = "MEDIUM";

    const id = uuidv4();
    const generatedRiskId = riskId || `RR-${Date.now().toString().slice(-4)}`;

    await prisma.riskRegister.create({
      data: {
        id,
        idTanah,
        riskId: generatedRiskId,
        kategoriRisiko: kategoriRisiko || 'Lainnya',
        deskripsiRisiko,
        penyebab: penyebab || null,
        dampakNarasi: dampakNarasi || null,
        existingControl: existingControl || null,
        statusTindakLanjut: statusTindakLanjut || 'Belum Ditindaklanjuti',
        pic: pic || 'BPKAD Bidang Aset',
        targetSelesai: targetSelesai ? new Date(targetSelesai) : null,
        skorDampak: d,
        skorPeluang: p,
        skorTotal,
        tingkatRisiko
      }
    });

    return NextResponse.json({ success: true, message: "Risiko berhasil disimpan!", id });
  } catch (error) {
    console.error("Error saving risk:", error);
    return NextResponse.json({ error: "Gagal menyimpan data risiko" }, { status: 500 });
  }
}
