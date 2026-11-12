import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PetaClient from "./PetaClient";

export const metadata = {
  title: "Live WebGIS Layar Penuh - SIM PASTI Aceh Tengah",
  description: "Visualisasi spasial batas bidang tanah Kabupaten Aceh Tengah secara penuh tanpa panel.",
};

export default async function PetaPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login?callbackUrl=/peta");
  }

  return <PetaClient />;
}

