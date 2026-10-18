import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak sah atau telah berakhir. Silakan login terlebih dahulu." }, 
        { status: 401 }
      );
    }

    const tanah = await prisma.$queryRaw`
      SELECT id, "assetId", "kodeTanah", "nibar", "namaBarang", luas, "statusHak", "statusLegalitas", "noSertifikat", "kategoriRisiko", ST_AsGeoJSON("koordinatPolygon") as geojson
      FROM tanah
      WHERE "koordinatPolygon" IS NOT NULL
    `;
    
    const risk = await prisma.$queryRaw`
      SELECT id, "kategoriRisiko", "deskripsiRisiko", "tingkatRisiko", ST_AsGeoJSON("koordinatTitik") as geojson
      FROM risk_register
      WHERE "koordinatTitik" IS NOT NULL
    `;
    
    return NextResponse.json({ tanah, risk });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json({ error: "Failed to fetch map data" }, { status: 500 });
  }
}
