import prisma from '@/lib/prisma';
import NewRiskForm from './NewRiskForm';


export default async function NewRiskPage() {
  const tanahList = await prisma.tanah.findMany({
    select: { id: true, namaBarang: true, nibar: true },
    orderBy: { namaBarang: 'asc' }
  });

  return <NewRiskForm tanahList={tanahList} />;
}
