import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditTanahForm from "./EditTanahForm";


export default async function EditTanahPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const result: any[] = await prisma.$queryRaw`
    SELECT 
      id, "nibar", "assetId", "kodeTanah", "kodeLokasi", "kodeBarang", "namaBarang", 
      "pengelola", "kecamatan", "kampung", "statusHak", "luas", 
      "statusLegalitas", "noSertifikat", "tanggalPerolehan", 
      "alamatLokasi", "asalPerolehan", "nilaiPerolehan", "dokumenSertifikat", "fotoAset",
      "papanAset", "batasBidang", "pagarPengamanan", "statusPenguasaan", "pemanfaatan", "permasalahan",
      "skorAdministrasi", "skorLegal", "skorFisik", "skorPenguasaan", "skorSengketa", "skorStrategis",
      "totalSkorRisiko", "kategoriRisiko", "prioritasTindakan",
      ST_AsGeoJSON("koordinatPolygon") as geojson
    FROM "tanah"
    WHERE id = ${id}
  `;

  const tanah = result[0];

  if (!tanah) return notFound();

  return (
    <div className="max-w-5xl mx-auto">
      <EditTanahForm tanah={tanah} />
    </div>
  );
}
