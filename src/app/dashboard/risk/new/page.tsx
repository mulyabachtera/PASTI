import prisma from '@/lib/prisma';
import NewRiskForm from './NewRiskForm';
import { DEMO_MODE, FORMS_UNDER_DEVELOPMENT } from '@/lib/demoConfig';
import FasePlaceholder from '@/components/dashboard/FasePlaceholder';

export default async function NewRiskPage() {
  if (DEMO_MODE || FORMS_UNDER_DEVELOPMENT) {
    return <FasePlaceholder type="form-risk" />;
  }

  const tanahList = await prisma.tanah.findMany({
    select: { id: true, namaBarang: true, nibar: true },
    orderBy: { namaBarang: 'asc' }
  });

  return <NewRiskForm tanahList={tanahList} />;
}
